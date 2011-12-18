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
@define('GANDER_ROOT', '/taz/'); // How the webbrowser should get to files. If you are installing Gander in the root dir this needs to be '/' if its in a folder called 'gander' it needs to be '/gander/'. This setting must always end in '/'

/**
* PATHS 
* All these must end with '/'
*/
@define('GANDER_ICONS', realpath(__DIR__ . '/../images/icons/') . '/');
@define('GANDER_ICONS_WEB', '/images/icons/'); # The web equivlenet of the above
@define('GANDER_PATH', '/home/mc/Papers/Pictures/');
//@define('GANDER_THUMBPATH', __DIR__ . '/cache/thumbs/');
@define('GANDER_THUMBPATH', '/tmp/gander/');
@define('GANDER_THUMBS_MAX_GET', 20); // Absolute maximum number of thumbs to return in any GET request
@define('GANDER_UNKNOWN_IGNORE', 1); // Hide unknown file types

/**
* General setup options
*/
@define('GANDER_ROOT_NAME', 'Gander'); // The name of the root node

/**
* Web request options
*/
@define('GANDER_WEB_TIME', 300); // Ideal amount of time the web request shoud take. This is used to tell the thumbnaier when to give up and return something.

/**
* Default thumbnailer resolutions
* Set these to the HIGHEST res you can imagine using
*/
@define('GANDER_THUMB_ABLE', '/png|jpe?g|gif$/i');
@define('GANDER_THUMB_WIDTH', 150);
@define('GANDER_THUMB_HEIGHT', 150);

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
@define('GANDER_TUNNEL_CMD', 0); // The command to use. This overrides the default which is 'TERM=dumb sudo -u taz /usr/bin/php __FILE__ 2>&1' where __FILE__ is the gander.php core PHP file
