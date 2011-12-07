<?
/**
* PATHS 
* All these must end with '/'
*/
define('GANDER_ICONS', __DIR__ . '/images/icons/');
define('GANDER_ICONS_WEB', '/images/icons/'); # The web equivlenet of the above
define('GANDER_PATH', '/home/mc/Papers/Pictures/Wallpapers/');
define('GANDER_THUMBPATH', __DIR__ . '/cache/thumbs/');

/**
* General setup options
*/
define('GANDER_ROOT_NAME', 'Gander'); // The name of the root node

/**
* Web request options
*/
define('GANDER_WEB_TIME', 3); // Ideal amount of time the web request shoud take. This is used to tell the thumbnaier when to give up and return something.

/**
* Default thumbnailer resolutions
* Set these to the HIGHEST res you can imagine using
*/
define('GANDER_THUMB_ABLE', '/png|jpe?g|gif$/i');
define('GANDER_THUMB_WIDTH', 150);
define('GANDER_THUMB_HEIGHT', 150);
