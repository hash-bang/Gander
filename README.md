Gander
======

_Gander is still under major development - use at your own risk_

A picture gallery system that works without requiring anything other than some media to show.

No databases, no screwing about with config. Put files in a directory and open the browser.

Gander provides a fully-featured Web 2.0 based picture viewer in the style of [ACDSee](http://www.acdsee.com) for Windows or [gThumb](http://live.gnome.org/gthumb) or [Geeqie](http://geeqie.sourceforge.net) for Linux.

Features:

* Zero setup - Dump it in a directory and open the webpage. No databases or any other configuration.
* Fully-featured - bindable controls for just about every feature of a gallery system.
* Scalable - Designed for very-large folders full of images.
* Forward and reverse caching of images - designed to keep the waiting at a minimum
* Thumbnailer system built in - No third-party tools or building thumbnails required.
* Configurable CSS styles and page layouts


Known issues
------------

* Zoom fit for images that are wider than they are tall doesn't work correctly (too zoomed in)
* Selected directory tree items dont seem to hilight correctly
* Navigating around a directory selects and tries to view folders (e.g. selecting 'first' when in image view in a folder containing sub-folders)
* Sorting is buggy - uses dumb sort rather than natural sort
* Settings are not currently loaded from the server on first execute
* Navigating away from a folder where thumbnails are still loading does not destroy the status message
* When loading an image the resize can be slow - i.e. resize doesn't occur until the image is completely loaded
* Throbber should be more subtle - perhaps move it to one of the screen corners or use Growl
* Non-writable cache dir error detection needs testing
* Recursive thumbnails (i.e. looking inside the thumbnail directory) will probably end in a crash
* Loading folder trees is slow as a query must be done to figure out if there are any child folders
* Emblems needed: Link, Folder icon / favourite

TODO list
---------

* Menus that display something useful
* Comments / description for images
* List view and column view of items
* Loading thumbnail icon for thumbnail view
* Functionality to navigate up/down/out/back/forward/switch (i.e. toggle between two most recent) directories
* Transition when displaying a newly created thumbnail (fadein perhaps?)
* Screen splitting (VIM style)
* Load images recursively from a tree
* Multiple image list tabs
* Pull in images into browse from other folders (similar to 'queue' in music players)
* Star image - implies view by starred or filter by starred
* Track image views - Save the last time an image was accessed
* Thumbnail for folders - 'Set as folder thumbnail' option
* In-image thumbnail quick navigation bar to show siblings
* Random and Random-lock functionality
* Slideshow functionality (i.e. pause for set time then go next)
* Image transitions
* Move, Copy, Paste, Rename, Change permission, Touch file functionality
* View other file types - e.g. text files, sound, movies
* Functionality to remember preferred zoom and position of image and restore it when needed
* Zoom via mouse wheel functionality (maybe hold down a modifier key?)
