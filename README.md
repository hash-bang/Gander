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
* Selected directory tree items dont seem to hilight correctly when changing directories
* Clicking directory names in the folder view is hard - text too small. Perhaps stretch to full width?
* Dir tree flows off vertical height of screen
* Sorting by date doesnt seem to do anything
* File names with '%20' in their names get screwed up
* When viewing recursively, thumbnails dont load in the sort order
* A maximum limit on number of files loaded recursively
* Exclude non-loadable items - e.g. .html files


TODO list
---------
* Natural sort
* Thumb-zoom implementation in menus / shortcuts
* Breadcrumb path
* Progress bar in thumbnail loading notification
* Left / right big buttons for scrolling on tablets
* Open directory in new tab
* Move, Copy, Paste, Rename, Change permission, Touch, Delete file functionality
* Next / previous image caching
* Side clicking (left and right) while in image view should move to next and previous image
* Image panning
* Throbber should be more subtle - perhaps move it to one of the screen corners or use Growl
* Emblems: Link, Folder icon / favourite
* Comments / description for images
* List view and column view of items
* Functionality to switch directories - i.e. toggle between two most recent
* Multiple image list tabs
* Star image - implies view by starred or filter by starred
* Track image views - Save the last time an image was accessed
* Thumbnail for folders - 'Set as folder thumbnail' option
* In-image thumbnail quick navigation bar to show siblings
* Random and Random-lock functionality
* Slideshow functionality (i.e. pause for set time then go next)
* Image transitions
* View other file types - e.g. text files, sound, movies
* Functionality to remember preferred zoom and position of image and restore it when needed
* Zoom via mouse wheel functionality (maybe hold down a modifier key?)
* Screen splitting (VIM style)
