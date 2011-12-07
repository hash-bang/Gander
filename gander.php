<?
function b64($filename) {
	$fh = fopen($filename, "r");
	$imgbinary = fread($fh, filesize($filename));
	fclose($fh);
	return 'data:image/png;base64,' . base64_encode($imgbinary);
}

function b64_thumb($filename, $path, $make = 0) {
	if (is_file($tpath = GANDER_THUMBPATH . $filename)) { // Look for existing
		return b64($tpath);
	} elseif ($make) { // No thumbnail found - make it
		mktree(GANDER_THUMBPATH, "$path/$filename");
		mkthumb($filename, GANDER_THUMBPATH . "$path/$filename");
		return b64($filename);
	} else { // No thumbnail + no make
		return FALSE;
	}
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

function mkthumb($in, $out) {
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

require('config.php');
chdir(GANDER_PATH);
switch ($_REQUEST['cmd']) {
	case 'get':
		echo json_encode(array(
			'data' => b64($_REQUEST['path']),
		));
		break;
	case 'list':
		if (!isset($_REQUEST['path'])) $_REQUEST['path'] = '';
		$_REQUEST['path'] = ltrim($_REQUEST['path'], '/');

		chdir(GANDER_PATH . $_REQUEST['path']);
		$folders = array();
		$files = array();
		$mkthumb = isset($_REQUEST['mkthumbs']) && $_REQUEST['mkthumbs'];
		$getthumb = isset($_REQUEST['getthumbs']) && $_REQUEST['getthumbs'];
		$panic = microtime(true) + GANDER_WEB_TIME;
		foreach (glob('*') as $file) {
			$path = ltrim("{$_REQUEST['path']}/$file", '/');
			$canthumb = preg_match(GANDER_THUMB_ABLE, $file);
			if (
				$getthumb &&
				microtime(1) < $panic &&
				$canthumb &&
				$thumb = b64_thumb($file, $_REQUEST['path'], $mkthumb)
			) { // Thumbnail found
				$files[$path] = array(
					'time' => microtime(1) . '/' . $panic,
					'title' => basename($file),
					'thumb' => $thumb,
				);
			} elseif (is_dir(GANDER_PATH . $path)) { // Folder (Also add a slash so we can tell its a folder)
				$folders["$path/"] = array(
					'title' => basename($file),
					'thumb' => 'images/icons/_folder.png',
				);
			} elseif (file_exists($tpath = GANDER_ICONS . pathinfo($path, PATHINFO_EXTENSION) . '.png')) { // File type thumb found
				$thumb = GANDER_ICONS_WEB . basename($tpath);
				$files[$path] = array(
					'title' => basename($file),
					'thumb' => $thumb,
				);
				if ($canthumb)
					$files[$path]['makethumb'] = 1;
			} else { // Unknown file type
				$files[$path] = array(
					'title' => basename($file),
					'thumb' => 'images/icons/_unknown.png',
				);
				if ($canthumb)
					$files[$path]['makethumb'] = 1;
			}
		}
		echo json_encode(array_merge($folders, $files));
		break;
	case 'tree':
		$out = array();
		if (!isset($_REQUEST['path'])) {
			$_REQUEST['path'] = '';
		} else
			$_REQUEST['path'] = ltrim($_REQUEST['path'], '/');
		chdir(GANDER_PATH . $_REQUEST['path']);
		foreach (glob('*') as $file)
			if (is_dir($file)) {
				$haschildren = 0;
				foreach (glob("$file/*") as $childfile)
					if (is_dir($childfile)) {
						$haschildren = 1;
						break;
					}

				$out[] = array(
					'key' => "{$_REQUEST['path']}/$file",
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
		echo json_encode($out);
		break;
}
