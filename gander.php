<?
function b64($filename) {
	$fh = fopen($filename, "r");
	if (!$fh)
		return;
	$imgbinary = fread($fh, filesize($filename));
	fclose($fh);
	return 'data:image/png;base64,' . base64_encode($imgbinary);
}

function getthumb($filename, $path) {
	$thumbpath = GANDER_THUMBPATH . "$path/$filename";
	if (is_file($thumbpath)) { // Look for existing
		switch (GANDER_THUMB_TRANSMIT) {
			case 0: return b64($thumbpath);
			case 1: return strtr(GANDER_THUMB_TRANSMIT_PATH, array('%p' => "$path/$filename"));
		}
	} else { // No thumbnail + no make
		return FALSE;
	}
}

function mkthumb($filename, $path) {
	$thumbpath = GANDER_THUMBPATH . "$path/$filename";
	mktree(GANDER_THUMBPATH, "$path/$filename");
	mkimg($filename, $thumbpath);
	return 1; // FIXME: Do something useful for failed images
}

function mktree($base, $path) {
	$cwd = getcwd();
	chdir($base);
	foreach (array_slice(explode('/', $path),0,-1) as $bit) {
		if (!$bit)
			continue;
		if (!is_dir($bit)) {
			if (!@mkdir($bit))
				die("Can't make directory '$bit' in dir " . getcwd());
		}
		chdir($bit);
	}
	chdir($cwd);
}

function mkimg($in, $out) {
	if (($imgsize = @getimagesize($in)) === false) // Make sure its a valid image
		return false;
	list($width_orig, $height_orig) = $imgsize;

	$ratio_orig = $width_orig/$height_orig;
	$width = $width_orig;
	$height = $height_orig;
	if (GANDER_THUMB_WIDTH/GANDER_THUMB_HEIGHT > $ratio_orig) {
		   $height = GANDER_THUMB_HEIGHT;
		   $width = GANDER_THUMB_HEIGHT*$ratio_orig;
	} else {
		   $width = GANDER_THUMB_WIDTH;
		   $height = GANDER_THUMB_WIDTH/$ratio_orig;
	}

	// Prepare canvas
	if (is_callable('imagecreatetruecolor')) {
		$imagedst = imagecreatetruecolor($width, $height);
	} elseif (is_callable('imagecreate')) {
		$imagedst = imagecreate($width, $height);
	} else
		die('McImg> GD does not seem to be installed');

	$informat = pathinfo($in, PATHINFO_EXTENSION);
	if (empty($informat) && function_exists('mime_content_type')) { // Still no format
		$mimes = array( // FIXME: This needs fleshing out
			'image/jpeg' => 'jpg',
			'image/png' => 'png',
			'image/gif' => 'gif',
		);
		if (isset($mimes[$mime = mime_content_type($in)])) {
			$informat = $mimes[$mime];
		} else
			die("McImg - Unknown MIME type '$mime'");
	}

	switch (strtolower($informat)) {
		case 'gif':
			$image = imagecreatefromgif($in);
			break;
		case 'jpg':
		case 'jpeg':
			$image = imagecreatefromjpeg($in);
			break;
		case 'png':
			$image = imagecreatefrompng($in);
			break;
		default:
			die("McImg - Unknown or unspecified image input format '$informat'");
	}
	// Resample
	imagecopyresampled($imagedst, $image, 0, 0, 0, 0, $width, $height, $width_orig, $height_orig);

	// Output
	imagepng($imagedst,$out);
	return $out;
}

function setting($setting, $value) {
	if (!defined($setting))
		define($setting, $value);
}

$header = array();
if (!isset($_SERVER['SERVER_NAME'])) { // Possibly being called from the command line
	$_REQUEST = unserialize(file_get_contents('PHP://STDIN'));
	$notunnel = 1; // Prevent loops later when we need to figure out whether to tunnel ourselves
	if (isset($_REQUEST['SERVER_NAME']))
		$_SERVER['SERVER_NAME'] = $_REQUEST['SERVER_NAME'];
}

// Process config
if (isset($_SERVER['SERVER_NAME']) && file_exists($s = "config/host_{$_SERVER['SERVER_NAME']}.php"))
	require($s);
require('config/settings.php');

if (GANDER_TUNNEL && !isset($notunnel)) {
	$cmd = GANDER_TUNNEL_CMD ? GANDER_TUNNEL_CMD : 'TERM=dumb sudo -u ' . GANDER_TUNNEL_USER . ' /usr/bin/php ' . __FILE__; // Work out which command to use
	$_REQUEST['SERVER_NAME'] = $_SERVER['SERVER_NAME']; // We need to carry this over because the config system depends on knowing the current server name
	$_REQUEST['IN_TUNNEL'] = 1;
	$proc = proc_open($cmd, array( // The dance of the pipes
		0 => array('pipe', 'r'),
		1 => array('pipe', 'w'),
		2 => array('pipe', 'w'),
	), $pipes);
	fwrite($pipes[0], serialize($_REQUEST)); // Ugh. But necessary
	fclose($pipes[0]);
	$content = stream_get_contents($pipes[1]); // Spew the output of this script running inside sudo
	$err = stream_get_contents($pipes[2]);
	if (preg_match_all('/^header (.*)$/m', $err, $headers, PREG_SET_ORDER)) // Read header info from STDERR
		foreach($headers as $header)
			header($header[1]);
	fclose($pipes[1]);
	fclose($pipes[2]);
	echo $content;
	$return = proc_close($proc);
	if ($return > 0) {
		echo json_encode(array('header' => array('errors' => array("Failed to tunnel correctly. Gander sub-process returned code #$return"))));
	}
	exit;
}

chdir(GANDER_PATH);
$header = array();
$cmd = $_REQUEST['cmd'];
switch ($cmd) {
	case 'hello':
		echo json_encode(array(
			'header' => $header,
			'data' => 'Hello World',
		));
		break;
	case 'get': // Retrieve an image
		switch (GANDER_THUMB_TRANSMIT) {
			case 0: // Return as JSON
				echo json_encode(array(
					'header' => $header,
					'data' => b64($_REQUEST['path']),
				));
				exit();
			case 1: // Return as stream
				$cmd = 'stream';
				break;
		}
		// Fall though to...
	case 'streamthumb': // Same as 'stream' but transmits the thumbnail instead of the real object
	case 'stream':
		if ($cmd == 'streamthumb') { // Get the real object
			$path = dirname(GANDER_THUMBPATH . ltrim($_REQUEST['path'], '/'));
		} else { // Get the thumb
			$path = GANDER_PATH . dirname(ltrim($_REQUEST['path'], '/'));
		}
		$file = basename($_REQUEST['path']);
		$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
		if (!isset($GLOBALS['mimes'][$ext]))
			$header['errors'][] = "Invalid mime type to request - $ext";
		if (!is_dir($path))
			$header['errors'][] = "Invalid object to stream - {$_REQUEST['path']}";
		if (isset($header['errors'])) { // Errors occured
			echo json_encode(array(
				'header' => $header,
				'data' => b64($_REQUEST['path']),
			));
			die();
		}
		chdir($path);
		if (isset($_REQUEST['IN_TUNNEL']) && $_REQUEST['IN_TUNNEL']) { // Transmit headers onto STDERR
			$STDERR = fopen('PHP://STDERR', 'a');
			fwrite($STDERR, "header Content-Type: " . $GLOBALS['mimes'][$ext] . "\n");
			fwrite($STDERR, "header Content-Transfer-Encoding: binary\n");
			fwrite($STDERR, "header Content-Length: " . filesize($file) . "\n");
			fwrite($STDERR, "header Last-Modified: " . date('r',filemtime($file)) . "\n");
		} else { // Set headers as normal
			header('Content-Type: ' . $GLOBALS['mimes'][$ext]);
			header('Content-Transfer-Encoding: binary');
			header('Content-Length: ' . filesize($file));
			header('Last-Modified: ' . date('r',filemtime($file)));
		}
		readfile($file);
		exit();
		break;
	case 'list':
		if (!isset($_REQUEST['path'])) $_REQUEST['path'] = '';
		$_REQUEST['path'] = ltrim($_REQUEST['path'], '/');

		chdir(GANDER_PATH . $_REQUEST['path']);
		$folders = array();
		$files = array();
		$sent = 0;
		$getthumb = isset($_REQUEST['thumbs']) && $_REQUEST['thumbs'];
		$mkthumb = isset($_REQUEST['mkthumbs']) && $_REQUEST['mkthumbs'];
		$maxthumbs = max( (isset($_REQUEST['max_thumbs']) ? $_REQUEST['max_thumbs'] : 0), GANDER_THUMBS_MAX_GET); // Work out the maximum number of thumbs to return
		$panic = microtime(1) + GANDER_WEB_TIME;
		$skip = isset($_POST['skip']) ? (array) $_POST['skip'] : array();

		if (!is_writable(GANDER_THUMBPATH))
			$header['errors'][] = 'The Gander thumbnail cache directory (' . GANDER_THUMBPATH . ') is not writable';
		foreach (glob('*') as $file) {
			$path = ltrim("{$_REQUEST['path']}/$file", '/');
			if (in_array($path, $skip))
				continue;
			$couldthumb = preg_match(GANDER_THUMB_ABLE, $file);
			if (
				$getthumb && // Requested thumbs
				$couldthumb && // We could potencially thumb the image
				microtime(1) < $panic && // Still got time to spend
				$thumb = getthumb($file, $_REQUEST['path']) // It was successful
			) { // Thumbnail found
				$files[$path] = array(
					'title' => basename($file),
					'realthumb' => 1,
					'thumb' => $thumb,
				);
			} elseif (
				$getthumb && // Requested thumbs
				$couldthumb && // We could potencially thumb the image
				$mkthumb && // Allowed to make thumbs
				microtime(1) < $panic && // Still got time to spend
				($maxthumbs == 0 || $sent++ < $maxthumbs) && // We care about the maximum number of thumbs to return AND we are below that limit
				mkthumb($file, $_REQUEST['path']) && // It was successful
				$thumb = getthumb($file, $_REQUEST['path']) // We can retrive it again
			) { // Thumbnail made
				$files[$path] = array(
					'title' => basename($file),
					'realthumb' => 1,
					'thumb' => $thumb,
					'fresh' => 1,
				);
			} elseif (is_dir(GANDER_PATH . $path)) { // Folder (Also add a slash so we can tell its a folder)
				$folders["$path/"] = array(
					'title' => basename($file),
					'thumb' => GANDER_ROOT . 'images/icons/_folder.png',
				);
			} elseif (($ext = pathinfo($path, PATHINFO_EXTENSION)) && file_exists($tpath = GANDER_ICONS . strtolower($ext) . '.png')) { // File type thumb found
				$files[$path] = array(
					'title' => basename($file),
					'thumb' => GANDER_ROOT . GANDER_ICONS_WEB . basename($tpath),
				);
				if ($couldthumb)
					$files[$path]['makethumb'] = 1;
			} elseif (!GANDER_UNKNOWN_IGNORE) { // Unknown file type
				$files[$path] = array(
					'title' => basename($file),
					'thumb' => GANDER_ROOT . 'images/icons/_unknown.png',
				);
				if ($couldthumb)
					$files[$path]['makethumb'] = 1;
			}
		}
		echo json_encode(array(
			'header' => $header,
			'list' => array_merge($folders, $files),
		));
		break;
	case 'tree':
		$out = array();
		if (!isset($_REQUEST['path'])) {
			$_REQUEST['path'] = '';
		} else {
			$_REQUEST['path'] = ltrim($_REQUEST['path'], '/');
			chdir(GANDER_PATH . $_REQUEST['path']);
		}
		foreach (glob('*') as $file)
			if (is_dir($file)) {
				$haschildren = 0;
				foreach (glob("$file/*") as $childfile)
					if (is_dir($childfile)) {
						$haschildren = 1;
						break;
					}

				$out[] = array(
					'key' => ($_REQUEST['path'] ? "/{$_REQUEST['path']}/$file" : "/$file"),
					//'key' => $file,
					'title' => $file,
					'isFolder' => 1,
					'isLazy' => ($haschildren ? 1 : 0),
				);
			}

		if ($_REQUEST['path'] == '') // Requesting root - populate root node
			$out = array(
				'key' => '/',
				'title' => GANDER_ROOT_NAME,
				'children' => $out,
				'isFolder' => 1,
				'expand' => true,
			);
		//$out['header'] = $header; // MC- Upsets the dynatree JSON parser
		echo json_encode($out);
		break;
}
