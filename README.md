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

* Navigating around a directory selects and tries to view folders (e.g. selecting 'first' when in image view in a folder containing sub-folders)
* Non-writable cache dir error detection needs testing
* Zoom fit for images that are wider than they are tall doesn't work correctly (too zoomed in)


TODO list
---------

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
