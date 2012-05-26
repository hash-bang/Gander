Gander
======
A picture gallery system that works without requiring anything other than some media to show.

No databases, no screwing about with config. Put files in a directory and open the browser.

Gander provides a fully-featured Web 2.0 based picture viewer in the style of [ACDSee](http://www.acdsee.com) for Windows or [gThumb](http://live.gnome.org/gthumb) or [Geeqie](http://geeqie.sourceforge.net) for Linux. The intention is to replicate all features from a desktop picture viewing program entirely in HTML, CSS and JavaScript.

Features:

* Zero setup - Dump it in a directory and open the webpage. No databases or any other configuration.
* Fully-featured - bindable controls for just about every feature of a gallery system.
* Scalable - Designed for very-large folders full of images.
* Forward and reverse caching of images - designed to keep the waiting at a minimum
* Thumbnailer system built in - No third-party tools or building thumbnails required.
* Configurable CSS styles and page layouts
* Advanced navigation - Move around folder tree's without leaving your keyboard


How it works & What you need
----------------------------
While the majority of Gander is entirely client based (HTML, CSS + JavaScript) unfortunately there are a few things that are still not possible in JavaScript alone.

To provide access to your server you will need to install a fairly simple PHP script somewhere on your server. The job of this script is to perform file level opeations such as generating thumbnails and working on the file itself (e.g. renaming, deleting etc).


Known issues
------------
* Thumbnails dont get generated when recursively viewing a directory
* Selected directory tree items dont seem to hilight correctly
* Folders containing meta characters such as ';' or ending in '!' wont load correctly (needs an escape)


TODO list
---------
* Next / previous image caching
* Side clicking (left and right) while in image view should move to next and previous image
* Image panning
* Throbber should be more subtle - perhaps move it to one of the screen corners or use Growl
* Emblems: Link, Folder icon / favourite
* Comments / description for images
* List view and column view of items
* Functionality to switch directories - i.e. toggle between two most recent
* Screen splitting (VIM style)
* Multiple image list tabs
* Star image - implies view by starred or filter by starred
* Track image views - Save the last time an image was accessed
* Thumbnail for folders - 'Set as folder thumbnail' option
* In-image thumbnail quick navigation bar to show siblings
* Random and Random-lock functionality
* Slideshow functionality (i.e. pause for set time then go next)
* Image transitions
* Move, Copy, Paste, Rename, Change permission, Touch, Delete file functionality
* View other file types - e.g. text files, sound, movies
* Functionality to remember preferred zoom and position of image and restore it when needed
* Zoom via mouse wheel functionality (maybe hold down a modifier key?)
