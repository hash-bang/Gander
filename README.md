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

* Scroll file window to top when loading a new directory
* Navigating around a folder no longer seems to select the active image
* Zoom fit for images that are wider than they are tall doesn't work correctly (too zoomed in)
* Navigating around a directory selects and tries to view folders (e.g. selecting 'first' when in image view in a folder containing sub-folders)
* Settings are not currently loaded from the server on first execute
* Non-writable cache dir error detection needs testing
* Navigating away from a folder where thumbnails are still loading does not destroy the status message
* Throbber should be more subtle - perhaps move it to one of the screen corners
* Recursive thumbnails (i.e. looking inside the thumbnail directory) will probably end in a crash
* Scrolling thumbnails on tablets doesn't seem to display all the available thumbnails
* Loading folder trees is slow as a query must be done to figure out if there are any child folders
* Sorting is buggy - uses dumb sort rather than natural sort
* Emblems needed: Link, Folder icon / favourite
* Change directory loading message to something shorter
* Selected items in the directory tree needs to be more obvious


TODO list
---------

* List view and column view of items
* Functionality to remember preferred zoom and position of image and restore it when needed
* Functionality to navigate up/down/out a directory
* Screen splitting (VIM style)
* Load images recursively from a tree
* Multiple image list tabs
* Pull in images into browse from other folders (similar to 'queue' in music players)
* Star image - implies view by starred or filter by starred
* Track image views - Save the last time an image was accessed
* Thumbnail for folders - 'Set as folder thumbnail' option
* In-image thumbnail quick navigation bar to show siblings
* Display 'end of list' or something when trying to navigate past the last item in a file list
* Random and Random-lock functionality
* Slideshow functionality (i.e. pause for set time then go next)
* Image transitions
* Move, Copy, Paste, Rename, Change permission, Touch file functionality
* View other file types - e.g. text files, sound, movies
