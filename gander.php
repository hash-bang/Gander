<?
function b64($filename) {
	$fh = fopen($filename, "r");
	if (!$fh)
		return;
	$imgbinary = fread($fh, filesize($filename));
	fclose($fh);
	return 'data:image/png;base64,' . base64_encode($imgbinary);
}

function getthumb($path) {
	$thumbpath = GANDER_THUMBPATH . $path;
	if (is_file($thumbpath)) { // Look for existing
		switch (GANDER_THUMB_TRANSMIT) {
			case 0: return b64($thumbpath);
			case 1: return strtr(GANDER_THUMB_TRANSMIT_PATH, array('%p' => $path));
		}
	} else { // No thumbnail + no make
		return FALSE;
	}
}

function mkthumb($filename, $path) {
	$thumbpath = GANDER_THUMBPATH . "$path/$filename";
	mktree(GANDER_THUMBPATH, $path);
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

// Inherit REQUEST[path] from redirect if necessary - Useful for bypassing strings such as '&' etc in the URI via mod_rewrite
if (isset($_SERVER['REDIRECT_path']))
	$_REQUEST['path'] = $_SERVER['REDIRECT_path'];


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
		echo json_encode(array('header' => array('errors' => array("Failed to tunnel correctly. Gander sub-process returned code #$return - CMD=$cmd, STDOUT=$err"))));
	}
	exit;
}

chdir(GANDER_PATH);
$header = array('errors' => array());
$cmd = $_REQUEST['cmd'];
switch ($cmd) {
	case 'hello':
		echo json_encode(array(
			'header' => $header,
			'data' => 'Hello World',
		));
		break;
	case 'init':
		echo json_encode(array(
			'header' => $header,
			'data' => array(
				'media_transmit' => GANDER_MEDIA_TRANSMIT,
				'media_transmit_path' => GANDER_MEDIA_TRANSMIT_PATH,
			),
		));
		break;
	case 'get': // Retrieve an image
		switch (GANDER_THUMB_TRANSMIT) {
			case 0: // Return as JSON
				echo json_encode(array(
					'header' => $header,
					'data' => b64(GANDER_PATH . $_REQUEST['path']),
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

	/**
	* Provide a JSON encoded list of images
	* This function is designed to provide the directory contents as quick as possible
	* If there is a readily available thumbnail path (and its NOT using inline Base64) then they will also be provided
	* @params string $_REQUEST['path'] A single path to explore or multiple paths seperated by ';'. If any path ends in '!' it is scanned recursively. If any meta character is preceeded by a backslash its purpose is ignored (e.g. '\!' translates to '!' and does nothing special)
	* @param bool $_REQUEST['recursive'] Force all directories to be recursive (this is the same as all paths ending in '!')
	*/
	case 'list':
		// Initial values
		$thumb = isset($_REQUEST['thumbs']) ? $_REQUEST['thumbs'] : 'none'; // make/quick/none
		$maxthumbs = min( (isset($_REQUEST['max_thumbs']) ? $_REQUEST['max_thumbs'] : 0), GANDER_THUMBS_MAX_GET); // Work out the maximum number of thumbs to return
		$filters = isset($_REQUEST['filters']) ? $_REQUEST['filters'] : array();
		$files = array();
		$sent = 0;

		$header['paths'] = array();

		if (!is_dir(GANDER_THUMBPATH)) { // Thumbnail path doesnt exist - try to make it
			if (!mkdir(GANDER_THUMBPATH)) {
				echo json_encode(array(
					'header' => array('errors' => array('The Gander thumbnail cache directory (' . GANDER_THUMBPATH . ') does not exist. Attempts to create the directory failed')),
				));
				exit;
			}
		}
		if (!is_writable(GANDER_THUMBPATH)) { // Sanity check for thumnnail folder permissions
			if (!chmod(GANDER_THUMBPATH, 777)) {
				echo json_encode(array(
					'header' => array('errors' => array('The Gander thumbnail cache directory (' . GANDER_THUMBPATH . ') is not writable. Attempts to adjust its permissions failed')),
				));
				exit;
			}
			$thumb = 'none';
			unset($_REQUEST['path']);
		}

		if (!isset($_REQUEST['path'])) {
			$paths = array('');
		} else {
			if ($paths = preg_split('/(?<!\\\\);/', $_REQUEST['path'])) { // Paths seprated by ';'
				$paths = array_map('trim', $paths);
			} else
				$paths = (array) trim($_REQUEST['path']); // Single path
		}

		for($p = 0; $p < count($paths); $p++) {
			$recurse = isset($_REQUEST['recursive']) && $_REQUEST['recursive'];
			$path = $paths[$p];
			$header['paths'][] = $path;
			if (preg_match('/(?<!\\\\)\!$/', $path)) { // Ends in '!' (but not \!)
				$path = substr($path, 0, -1);
				$recurse = 1;
			} else
				$path = ltrim($path, '/');

			if (!is_dir(GANDER_PATH . $path)) {
				$header['errors'][] = "Invalid directory: $path";
				continue;
			}

			chdir(GANDER_PATH . $path);
			$dbc = (file_exists(".gander.json")) ? json_decode(file_get_contents(".gander.json"), TRUE) : array();
			foreach (glob('*') as $base) {
				$file = "$path/$base";
				if (in_array($path, $skip)) // Skip paths listed as skipable
					continue;
				$files[$file] = array( // Basic file info
					'title' => basename($file),
					'size' => filesize(GANDER_PATH . $file),
					'date' => filemtime(GANDER_PATH . $file),
				);
				if (isset($dbc[$base]))
					$files[$file] = array_merge($files[$file], $dbc[$base]); // Merge database contents into file information

				if ($filters && count(array_intersect(array_keys($filters), $files[$file]['emblems'])) != count($filters)) { // Is missing a filter that we need
					unset($files[$file]);
					continue;
				}
				if ($canthumb = preg_match(GANDER_THUMB_ABLE, $file))
					$files[$file]['type'] = 'image';
				if (
					$canthumb // We COULD thumbnail this
					&& $sent++ < $maxthumbs
					&& $thumb = getthumb($file) // A thumbnail already exists
				) {
					$files[$file]['thumb'] = $thumb;
				} elseif (is_dir(GANDER_PATH . $file)) {
					$files[$file]['type'] = 'dir';
					if ($thumb != 'none')
						$files[$file]['thumb'] = GANDER_ROOT . 'images/icons/_folder.png';
					if ($recurse)
						array_splice($paths, $p+1, 0, $file);
				}
			}
		}
		echo json_encode(array(
			'header' => $header,
			'list' => $files,
		));
		break;
	/**
	* Retrieve a list of thumbnails based on the given paths
	* @params array|string $_REQUEST['paths'] An array of paths to get the thumbnails for. If this is a string it will be run though json_decode first
	* @param int $_REQUEST['max_thumbs'] The maximum number of thumbs to attempt to make if $_REQUEST['thumbs'] = 'make'
	*/
	case 'thumbs':
		$thumbs = array();
		$maxthumbs = max( (isset($_REQUEST['max_thumbs']) ? $_REQUEST['max_thumbs'] : 0), GANDER_THUMBS_MAX_GET); // Work out the maximum number of thumbs to return
		$sent = 0; // Number of thumbnails generated (must not exceed $maxthumbs if $maxthumbs>0)

		if (is_string($_REQUEST['paths']))
			$_REQUEST['paths'] = json_decode($_REQUEST['paths']);

		if (!is_dir(GANDER_THUMBPATH)) { // Thumbnail path doesnt exist - try to make it
			$header['errors'][] = 'The Gander thumbnail cache directory (' . GANDER_THUMBPATH . ') does not exist';
		} elseif (!is_writable(GANDER_THUMBPATH)) { // Sanity check for thumnnail folder permissions
			$header['errors'][] = 'The Gander thumbnail cache directory (' . GANDER_THUMBPATH . ') is not writable';
		} elseif (!isset($_REQUEST['paths'])) {
			$header['errors'][] = 'No paths specified when retrieving thumbnails';
		} elseif (!is_array($_REQUEST['paths'])) {
			$header['errors'][] = 'Paths is not an array';
		} else { // All is well - get the thumbnail lsit
			foreach ($_REQUEST['paths'] as $path) {
				$file = basename($path);
				$canthumb = preg_match(GANDER_THUMB_ABLE, $file);
				if (preg_match('!\.\.!', $path)) { // Last sanity check that we are witin the correct path
					$header['errors'][] = "Double dot paths are not allowed when requesting thumb: $path";
				} elseif (!file_exists(GANDER_PATH . $path)) {
					$header['errors'][] = "File does not exist when requesting thumb: $path";
				} else { // OK actually make the thumbnail
					if ($canthumb && $tpath = getthumb($path)) { // Thumbnail already exists
						$thumbs[$path] = $tpath;
					} elseif (is_dir(GANDER_PATH . $path)) { // Its a folder - Return the default image for now - FIXME: in future we could make thumbnails recursively
						$thumbs[$path] = GANDER_ROOT . 'images/icons/_folder.png';
					} elseif ( // Make a new thumbnail
						$canthumb
						&& ($maxthumbs == 0 || $sent < $maxthumbs) // We care about the maximum number of thumbs to return AND we are below that limit
						&& mkthumb($file, $path) // It was successful
						&& $tpath = getthumb($path) // We can retrive it again
					) {
						$thumbs[$path] = $tpath;
						$sent++;
					} elseif ( // File type thumb found but we do have an icon for its generic type
						($ext = pathinfo($file, PATHINFO_EXTENSION))
						&& file_exists($tpath = GANDER_ICONS . strtolower($ext) . '.png')
					) {
						$thumbs[$path] = GANDER_ROOT . GANDER_ICONS_WEB . basename($tpath);
					} elseif (!GANDER_THUMB_RESTRICT) { // Unknown file type - but include it anyway
						$thumbs[$path] = GANDER_ROOT . 'images/icons/_unknown.png';
					} else { // Unknown file type - no idea what to do here
						$thumbs[$path] = GANDER_ROOT . 'images/icons/_unknown.png';
					}
				}
			}
			echo json_encode(array(
				'header' => $header,
				'thumbs' => $thumbs,
			));
		}
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

	case 'emblem':
		if (!isset($_REQUEST['path']))
			$header['errors'][] = "No paths specified to apply emblems to";
		if (!isset($_REQUEST['emblem']))
			$header['errors'][] = "No emblems specified";
		if (!isset($_REQUEST['operation']))
			$header['errors'][] = "No operation specified";
		if (!$header['errors']) { // Apply
			$base = basename($_REQUEST['path']);
			$db = GANDER_PATH . dirname($_REQUEST['path']) . "/.gander.json";

			$dbc = (file_exists($db)) ? json_decode(file_get_contents($db), TRUE) : array();
			switch ($_REQUEST['operation']) {
				case 'add':
					if (!isset($dbc[$base]))
						$dbc[$base] = array();
					if (!isset($dbc[$base]['emblems']))
						$dbc[$base]['emblems'] = array();
					if (!in_array($_REQUEST['emblem'], $dbc[$base]['emblems']))
						$dbc[$base]['emblems'][] = $_REQUEST['emblem'];
					break;
				case 'remove':
					if (!isset($dbc[$base]) || !isset($dbc[$base]['emblems'])) // Not set anyway
						break;
					$dbc[$base]['emblems'] = preg_grep('/' . preg_quote($_REQUEST['emblem']) . '/', $dbc[$base]['emblems'], PREG_GREP_INVERT);
					if (!$dbc[$base]['emblems']) // Emblem array is now blank - nuke it
						unset($dbc[$base]['emblems']);
					if (!$dbc[$base]) // Main file info array is now blank - nuke it
						unset($dbc[$base]);
					break;
				default:
					$header['errors'][] = "Unknown emblem operation: {$_REQUEST['operation']}";
			}
			file_put_contents($db, json_encode($dbc));
		}

		echo json_encode(array(
			'header' => $header,
		));
		
}
