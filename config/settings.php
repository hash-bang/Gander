<?
/**
* This is the global Gander config file.
* You can either change the settings below or place the settings to be read in its own file within this directory.
*
* The order of precidence is:
*
*	* config/host_<hostname>.php - Where <hostname> is $_SERVER['SERVER_NAME']
*	* config/settings.php - This global settings file
*
*/

/**
* Web config
*/
@define('GANDER_ROOT', '/'); // How the webbrowser should get to files. If you are installing Gander in the root dir this needs to be '/' if its in a folder called 'gander' it needs to be '/gander/'. This setting must always end in '/'

/**
* Web UI
*/
@define('BOOTSTRAP_CSS', 'slate'); // Which bootstrap theme to use. Leave blank for default or enter the name of a directory located in lib/bootswatch (see http://bootswatch.com/ for more)

/**
* PATHS 
* All these must end with '/'
*/
@define('GANDER_ICONS', realpath(__DIR__ . '/../images/icons/') . '/');
@define('GANDER_ICONS_WEB', '/images/icons/'); # The web equivalent of the above
@define('GANDER_PATH', realpath(__DIR__ . '/../pictures/'));
@define('GANDER_THUMBPATH', realpath(__DIR__ . '/../cache/thumbs/'));
@define('GANDER_THUMBS_MAX_GET', 20); // Absolute maximum number of thumbs to return in any GET request

/**
* General setup options
*/
@define('GANDER_ROOT_NAME', 'Gander'); // The name of the root node

/**
* Streaming and transmission options
*/
@define('GANDER_THUMB_TRANSMIT', 0); // 0 - Encode as JSON response, 1 - Stream
@define('GANDER_THUMB_TRANSMIT_PATH', 'images/%p'); // If GANDER_THUMB_TRANSMIT == 1 this is the prefix prepended to the image path. %p is replaced with the file path. Point this at either the real directory used in GANDER_PATH if its exposed to the web or use Ganders inbuilt streaming as in the next example
//@define('GANDER_THUMB_TRANSMIT_PATH', 'gander.php?cmd=streamthumb&path=%p'); // Example path where Gander will stream the file. Useful if GANDER_PATH is outside the accessible document root

@define('GANDER_MEDIA_TRANSMIT', 0); // 0 - Encode as JSON response, 1 - Stream
@define('GANDER_MEDIA_TRANSMIT_PATH', 'images/%p'); // If GANDER_MEDIA_TRANSMIT == 1 this is the prefix prepended to the image path. See GANDER_THUMB_TRANSMIT_PATH for details.
//@define('GANDER_MEDIA_TRANSMIT_PATH', 'gander.php?cmd=stream&path=%p'); // Example path where Gander will stream the file. Useful if GANDER_PATH is outside the accessible document root


/**
* Web request options
*/
@define('GANDER_WEB_TIME', 300); // Ideal amount of time the web request shoud take. This is used to tell the thumbnaier when to give up and return something.

/**
* Default thumbnailer resolutions
* Set these to the HIGHEST res you can imagine using
*/
@define('GANDER_THUMB_ABLE', '/\.(?:png|jpe?g|gif)$/i');
@define('GANDER_THUMB_WIDTH', 150);
@define('GANDER_THUMB_HEIGHT', 150);
@define('GANDER_THUMB_RESTRICT', 1); // Only return thumbable items (i.e. skip all other file types)

/**
* Sudo tunnel options
* The following options allow you to run Gander via a Sudo tunnel. This is useful if you want Gander to access your files as another user rather than the default www-data Apache user.
* The settings below are not for the faint of heart and require some configuration with Sudo to work correctly. When setup Gander will act like a normal webserver but tunnel all connections though a clone of itself running inside a Sudo session as another user.
* Needless to say www-data (or whatever your web server is running as) will need an entry in the Sudoers file which looks something like this:
*
*	www-data ALL=(taz) NOPASSWD: /usr/bin/php /home/mc/Papers/Servers/Gander/gander.php
*
* In the above 'www-data' (Apache) can run the gander PHP file as the user 'taz' which is the user we wish to impersonate when accessing the files.
*
* It is recommended that the above be entered not by editing the /etc/sudoers file directly but by running 'sudo visudo' which not only does error checking of your syntax but also stops you from locking yourself out of your own system if anything goes wrong.
* Good luck.
*/
@define('GANDER_TUNNEL', 0); // Allow Gander to tunnel itself though Sudo. Read the section on this in the config/settings.php file for more details
@define('GANDER_TUNNEL_USER', 'images'); // The user to assume the identify of
@define('GANDER_TUNNEL_CMD', 0); // The command to use. This overrides the default which is 'TERM=dumb sudo -u <GANDER_TUNNEL_USER> /usr/bin/php __FILE__ 2>&1' where __FILE__ is the gander.php core PHP file

/**
* Mime type setup
* This is a list of all known file extensions along with their mime type
* If the file extension is not listed in here Gander will not list that file
*/
$GLOBALS['mimes'] = array(
'gif' => 'image/gif',
'jfif' => 'image/jpeg',
'jpe' => 'image/jpeg',
'jpeg' => 'image/jpeg',
'jpg' => 'image/jpeg',
'png' => 'image/png',
'tif' => 'image/tiff',
'tiff' => 'image/tiff',
);
