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
define('GANDER_ROOT', '/taz/'); // How the webbrowser should get to files. If you are installing Gander in the root dir this needs to be '/' if its in a folder called 'gander' it needs to be '/gander/'. This setting must always end in '/'

/**
* PATHS 
* All these must end with '/'
*/
define('GANDER_ICONS', __DIR__ . '/images/icons/');
define('GANDER_ICONS_WEB', '/images/icons/'); # The web equivlenet of the above
define('GANDER_PATH', '/home/mc/Papers/Pictures/');
//define('GANDER_THUMBPATH', __DIR__ . '/cache/thumbs/');
define('GANDER_THUMBPATH', '/tmp/gander/');
define('GANDER_THUMBS_MAX_GET', 20); // Absolute maximum number of thumbs to return in any GET request

/**
* General setup options
*/
define('GANDER_ROOT_NAME', 'Gander'); // The name of the root node

/**
* Web request options
*/
define('GANDER_WEB_TIME', 300); // Ideal amount of time the web request shoud take. This is used to tell the thumbnaier when to give up and return something.

/**
* Default thumbnailer resolutions
* Set these to the HIGHEST res you can imagine using
*/
define('GANDER_THUMB_ABLE', '/png|jpe?g|gif$/i');
define('GANDER_THUMB_WIDTH', 150);
define('GANDER_THUMB_HEIGHT', 150);
