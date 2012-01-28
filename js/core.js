$(function() {
	$.extend({ gander: {
		/**
		* Gander configuration options
		* @var array
		*/
		options: {
			gander_server: 'gander.php',
			menu_hide_on_view: 1,
			mouse_hide_on_view: 1,
			sort: 'name', // Sort method. Values: name, random
			sort_folders_first: 1, // Override 'sort' to always display folders first
			sort_reset: 'name', // Reset the sort method to this when changing dir (set to '' to keep the sort setting)
			sort_random_selected_first: 1, // When shuffling move the currently active item to the top
			zoom_thumb_normal: 150, // Size, in pixels, of the thumbnails
			zoom_thumb_adjust: 20,
			zoom_thumb_min: 50,
			zoom_thumb_max: 150,
			zoom_adjust: 10,
			zoom_min: 10,
			zoom_max: 1000,
			zoom_on_open: 'fit', // How to zoom when the image changes. See $.gander.zoom for options. e.g. 'reset', 'fit'
			zoom_stretch_smaller: 1, // 1 - Stretch smaller images bigger to fit, 0 - Zoom smaller images to 100%
			thumbs_max_get_first: 0, // Maximum number of thumbs to request on first sweep, set to 0 for all
			thumbs_max_get: 10, // Subsequent number of thumbs per request
			fullscreen: 0, // 0 - Just display, 1 - Try for real fullscreen layout
			throb_from_fullscreen: 1, // Display the throbber when coming from the browser to fullscreen
			jGrowl: {position: 'bottom-right', life: 5000}, // Options passed to jquery.jGrowl
			menu: {theme:'human'}, // Options passed to jquery.contextmenu

			// The following options are supplied by the server. Overwriting these will have little effect
			media_transmit: 1,
			media_transmit_path: '/taz/media/%p'
		},
		/**
		* Details on the currently viewed image
		* @var array
		*/
		current: {
			offset: 0,
			thumbzoom: 150, // Inherited from zoom_thumb_normal during init()
			zoom: 100,
			width: 0,
			height: 0,
			path: '',
			viewing_path: ''
		},
		/**
		* The active navigation path
		* @var string
		* @see cd()
		*/
		path: '/',
		/**
		* Array of cached images. Each image path is specified as the key
		* @var array
		*/
		cache: {},

		/**
		* Initialization function
		* Should be called once on startup
		*/
		init: function() {
			// Navigation
			shortcut.add('a', function() { $.gander.select('previous'); });
			shortcut.add('shift+a', function() { $.gander.select('-10'); });
			shortcut.add('s', function() { $.gander.select('next'); });
			shortcut.add('shift+s', function() { $.gander.select('+10'); });
			shortcut.add('z', function() { $.gander.select('first'); });
			shortcut.add('x', function() { $.gander.select('last'); });
			shortcut.add('home', function() { $.gander.select('first'); });
			shortcut.add('end', function() { $.gander.select('last'); });
			shortcut.add('pageup', function() { $.gander.select('first'); });
			shortcut.add('pagedown', function() { $.gander.select('last'); });
			shortcut.add('left', function() { $.gander.select('previous'); });
			shortcut.add('right', function() { $.gander.select('next'); });
			shortcut.add('space', function() { $.gander.select('next'); });

			// Zooms
			shortcut.add('w', function() { $.gander.zoom('in'); });
			shortcut.add('q', function() { $.gander.zoom('out'); });
			shortcut.add('e', function() { $.gander.zoom('fit'); });
			shortcut.add('r', function() { $.gander.zoom('reset'); });
			shortcut.add('+', function() { $.gander.zoom('in'); });
			shortcut.add('-', function() { $.gander.zoom('out'); });
			shortcut.add('shift+up', function() { $.gander.zoom('in'); });
			shortcut.add('shift+down', function() { $.gander.zoom('out'); });

			// Move within tree
			shortcut.add('ctrl+left', function() { $.gander.tree('up'); });
			shortcut.add('ctrl+right', function() { $.gander.tree('in'); });
			shortcut.add('ctrl+up', function() { $.gander.tree('previous'); });
			shortcut.add('ctrl+down', function() { $.gander.tree('next'); });

			// Viewer
			shortcut.add('f', function() { $.gander.viewer('toggle'); });
			shortcut.add('escape', function() { $.gander.viewer('hide'); });

			// Sort modes
			shortcut.add('t', function() { $.gander.sort('random'); });
			shortcut.add('shift+t', function() { $.gander.sort('name'); });

			// Window controls
			shortcut.add('n', function() { $.gander.window('clone'); });

			// Menus
			// See http://www.javascripttoolbox.com/lib/contextmenu/ for syntax
			$.gander.options['menu.item'] = [
				{'Open':{icon: 'images/menus/open.png', onclick: function() { $.gander.viewer('open', $(this).attr('rel')); }}},
				{'Fullscreen':{icon: 'images/menus/fullscreen.png', onclick: function() { $.gander.viewer('open', $(this).attr('rel')); }}},
			];
			$.gander.options['menu.item-folder'] = [
				{'Open':{icon: 'images/menus/folder-open.png', onclick: function() { $.gander.cd($(this).attr('rel')); }}},
				{'Open recursive':{icon: 'images/menus/folder-recurse.png', onclick: function() { $.gander.cd($(this).attr('rel') + '!'); }}},
			];
			$.gander.options['menu.list'] = [
				{'Refresh':{icon: 'images/menus/refresh.png', onclick: function() { $.gander.refresh(); }}},
				$.contextMenu.separator,
				{'Go to top':{icon: 'images/menus/top.png', onclick: function() { $.gander.select('first'); }}},
				{'Go to bottom':{icon: 'images/menus/top.png', onclick: function() { $.gander.select('bottom'); }}},
			];
			$.gander.options['menu.tree'] = [
				$.contextMenu.separator,
				{'Home':{icon: 'images/menus/home.png', onclick: function() { $.gander.cd('/'); }}},
				$.contextMenu.separator,
				{'Go up':{icon: 'images/menus/up.png', onclick: function() { $.gander.tree('up'); }}},
				{'Next dir':{icon: 'images/menus/next.png', onclick: function() { $.gander.tree('next'); }}},
				{'Previous dir':{icon: 'images/menus/previous.png', onclick: function() { $.gander.tree('previous'); }}},
			];
			$.gander.options['menu.image'] = [
				{'Close':{icon: 'images/menus/list.png', onclick: function() { $.gander.viewer('hide'); }}},
				$.contextMenu.separator,
				{'Next':{icon: 'images/menus/next.png', onclick: function() { $.gander.select('next'); }}},
				{'Previous':{icon: 'images/menus/previous.png', onclick: function() { $.gander.select('previous'); }}},
				$.contextMenu.separator,
				{'Zoom to 100%':{icon: 'images/menus/zoom-actual.png', onclick: function() { $.gander.zoom('normal', 'lock'); }}},
				{'Zoom fit':{icon: 'images/menus/zoom-fit.png', onclick: function() { $.gander.zoom('fit', 'lock'); }}},
				// FIXME: These should have unique icons
				{'Zoom fit width':{icon: 'images/menus/zoom-fit.png', onclick: function() { $.gander.zoom('fit-width', 'lock'); }}},
				{'Zoom fit height':{icon: 'images/menus/zoom-fit.png', onclick: function() { $.gander.zoom('fit-height', 'lock'); }}},
			];

			// NO CONFIG BEYOND THIS LINE
			$(document).bind('mousewheel', function(event, delta) {
				if ($.gander.viewer('isopen')) { // Only capture if we are viewing
					$.gander.select(delta > 0 ? 'previous' : 'next');
					return false;
				}
			});
			$('#window-list').contextMenu($.gander.options['menu.list'],$.gander.options['menu'])
			$('#window-dir').contextMenu($.gander.options['menu.tree'],$.gander.options['menu'])
			$('#window-display').contextMenu($.gander.options['menu.image'],$.gander.options['menu'])

			// Default values
			$.gander.current['thumbzoom'] = $.gander.options['zoom_thumb_normal'];

			// Window setup
			//$('#window-display, #window-list').dialog();
			$('#window-dir #dirlist').touchScroll({scrollHeight: 10000});
			$('#window-display').hide();
			$('#window-display #display, #window-display').click(function() { $.gander.viewer('hide'); });

			$(document).on('click', '.jGrowl', function() { // When clicking on a jGrowl popup - kill it
				$(this).jGrowl('close');
			});

			// Menu setup
			$("#mainmenu").wijmenu({
				orientation: "horizontal",
				showDelay: 100,
				showAnimation: {animated:"slide", option: { direction: "up" }, duration: 100, easing: null}
			});
			$(".wijmo-wijmenu-link").hover(function () {
				$(this).addClass("ui-state-hover");
			}, function () {
				$(this).removeClass("ui-state-hover");
			})

			// Filetree setup
			$('#dirlist').dynatree({
				minExpandLevel: 1,
				imagePath: '/js/jquery.dynatree.skin/',
				clickFolderMode: 3,
				selectMode: 1,
				keyboard: false,
				idPrefix: "dynatree-id-",
				fx: { height: 'toggle', duration: 200 },
				noLink: true,
				initAjax: {
					url: $.gander.options['gander_server'] + '?cmd=tree',
				},
				onPostInit: function() {
					$.gander._cdtree();
				},
				onLazyRead: function(node) {
					node.appendAjax({
						url: $.gander.options['gander_server'] + '?cmd=tree',
						data: { path: node.data.key },
						success: function() {
							$.gander._cdtree();
						}
					});
				},
				onClick: function(node) {
					$.gander.cd(node.data.key);
				},
				strings: {
					loading: "Loading...",
					loadError: "Load error!"
				}
			});

			// MC - Fix to pickup keypress events when in fullscreen and relay them to the correct callback
			/*$(window).delegate('*', 'keypress', function(e) {
				console.log('DETECT ' + e.keyCode);
				if (window.fullScreenApi.isFullScreen()) { // We only care if we are in fullscreen mode
					var key = String.fromCharCode(e.keyCode);
					if (key in shortcut.all_shortcuts) {
						shortcut.all_shortcuts[key].callback();
						e.preventDefault();
						return false;
					}
				}
			});*/
			$('#window-display #startup_error').remove();
		},
		/**
		* Simple, idiot proof command runner.
		* This stub is intended to execute simple verbs (open, close, zoom/in, zoom/out etc)
		*/
		exec: function(cmd, cmd2) {
			switch(cmd) {
				case 'zoom': // see $.gander.zoom
					alert('FIXME: Feature missing');
					break;
				case 'thumbzoom': // see $.gander.thumbzoom
					$.gander.thumbzoom(cmd2);
					break;
				case 'viewer': // see $.gander.viewer
					$.gander.viewer(cmd2);
					break;
				default:
					alert('Unknown command: ' + cmd);
			}
		},
		/**
		* Simple function to display a message to the user
		* @param string type The type of the message. Values: notice, error, thumbnails
		* @param string text The actual text of the message
		* @param string id Unique ID to bind the jGrowl notifier to. If the ID already exists the notification will not be created again
		* @param array options Optional jGrowl options to add to the defaults
		* @return bool True if the message was created, false if it already exists
		*/
		growl: function(type, text, id, options) {
			var opts = $.gander.options['jGrowl'];
			if (id && $('#' + id).length > 0) // Assign an ID but this ID already exists - abort
				return;
			opts['open'] = function(e,m,o) {
				if (id)
					e.find('.jGrowl-message').attr('id', id);
				if (type)
					e.find('.jGrowl-header').append('<img src="images/growl/' +  type + '.png"/>');
			};
			$.jGrowl(text, $.extend(opts, options));
			return 1;
		},
		/**
		* Updates the text of a notification created with $.gander.growl()
		* @param string id The ID of the message to update
		* @param string text The new status text to use
		* @see growl()
		*/
		growl_update: function(id, text) {
			$('#' + id).html(text);
		},
		/**
		* Closes a notification created with $.gander.growl()
		* @param string id The ID of the message to close
		* @see growl()
		*/
		growl_close: function(id) {
			$('#' + id).parents('.jGrowl-notification').remove();
		},
		/**
		* Internal function to deal with AJAX responses.
		* This function unpacks the response and relays any errors to the user
		* @param string operation What operation was being performed at the time
		* @param json json The JSON server response object
		*/
		_unpack: function(operation, json) {
			if (!json.header) {
				$.gander.growl('error', 'Missing header in JSON API query while doing ' + operation);
				console.log('Missing header on ' + operation);
				return;
			}
			if (json.header.errors && json.header.errors.length > 0) {
				$.each(json.header.errors, function(o, e) {
					$.gander.growl('error', e);
					console.log('Error on ' + operation + ' - ' + e);
				});
			}
		},
		/**
		* Internal functionality to navigate down the hierarchical tree
		* This gets complex because the tree is loaded dynamicly as needed so we have to open a node, then wait until the sub-nodes load to continue
		* @param string path Optional eventual path to navigate to. If unspecified a check is performed to see if any child sub-nodes are ready for expansion
		* @access private
		*/
		_cdtreebits: [],
		_cdtree: function(path) {
			if (path) { // New tree spec - break up into bits
				var fullpath = '';
				$.gander._cdtreebits = $.map(path.substr(1).split('/'), function(i) {
					fullpath += '/' + i;
					return fullpath;
				});
			}
			if ($.gander._cdtreebits.length > 0) {
				while(walk = $.gander._cdtreebits.shift()) { // Walk as far down the tree as we can
					var node = $('#dirlist').dynatree('getTree').getNodeByKey(walk);
					if (node) {
						node.activate();
						if (!node.isExpanded())
							node.toggleExpand();
						setTimeout("$('#dirlist').dynatree('getTree').getNodeByKey('" + walk + "').focus()", 0);
					} else {
						$.gander._cdtreebits.unshift(walk); // Put back on watch stack
						break;
					}
				};
			}
		},
		/**
		* Change the file list to a given path
		* This also refreshes the file list contents as loads thumbnails as needed
		* @param string path The new path to change the file list to
		* @param bool treerefresh Whether to refresh the directory tree. This is used by internal functions to instruct the DynaTree element to redraw the selected element
		*/
		cd: function(path, treerefresh) {
			$.ajax({
				url: $.gander.options['gander_server'], 
				dataType: 'json',
				type: 'POST',
				data: {cmd: 'list', path: path, thumbs: 'quick', max_thumbs: $.gander.options['thumbs_max_get_first']},
				success: function(json) {
					$.gander._unpack('cd', json);
					var list = $('#list');
					var couldthumb = 0; // How many thumbs there are left to load
					if (path.substr(0,1) != '/')
						path = '/' + path;
					$.gander.path = path;
					window.location.hash = path;

					list.empty();
					$.each(json.list, function(file, data) {
						if (data.couldthumb)
							couldthumb++;
						var fakeicon = (data.realthumb) ? 1:0;
						var newchild = $('<li rel="' + file + '"><div><div class="imgframe"><img rel="' + fakeicon + '"/></div></div><strong>' + data.title + '</strong><div class="emblems"></div></li>');
						newchild
							.click($.gander._itemclick)
							.data({
								size: data.size,
								data: data.date,
								type: data.type,
							})
							//.contextMenu(data.type == 'dir' ? $.gander.options['menu.item-folder'] : $.gander.options['menu.item'],$.gander.options['menu'])
							.find('img')
								.load(function() { $.gander.thumbzoom('apply', this); $(this).fadeIn(); $(this).parent('li').css('background', ''); })
								.attr('src', data.thumb);
						list.append(newchild);
					});
					$.gander.sort($.gander.options['sort_reset']);
					$.gander.current['path'] = null;
					$.gander.select('first');
					if (couldthumb > 0) { // Still more work to do
						setTimeout($.gander.refresh, 0);
						$.gander.growl('thumbnails', couldthumb + ' remaining', 'thumbnailer_info', {header: 'Creating thumbnails', sticky: 1});
					}
					if (treerefresh)
						$.gander._cdtree($.gander.path);
				},
				error: function(e,xhr,exception) {
					$.gander.growl('error', 'Error while changing to directory ' + path + ' - ' + xhr.responseText + ' - ' + exception);
				}
			});
		},
		/**
		* Similar to 'cd' except this funciton tries to redraw an existing file store
		* Usually used when refreshing thumbnails
		*/
		refresh: function() {
			console.log('REFRESH!');
			var skip = []; // Calculate skip list from items we have in stock
			$('#list li img[rel="1"]').each(function(o,i) {
				skip.push($(i).parents('li').attr('rel'));
			});

			$.ajax({
				url: $.gander.options['gander_server'], 
				dataType: 'json',
				type: 'POST',
				data: {cmd: 'list', path: $.gander.path, thumbs: 'make', max_thumbs: $.gander.options['thumbs_max_get_first'], skip: skip},
				success: function(json) {
					$.gander._unpack('refresh', json);
					var list = $('#list');
					var couldthumb = 0;
					var needsort = 0;
					$.each(json.list, function(file, data) {
						if (data.couldthumb)
							couldthumb++;
						var existing = $('#list li[rel="' + file + '"]');
						if (existing.length > 0) { // Item already exists
							existing.find('img')
								.load(function() {
									$(this).hide()
									$.gander.thumbzoom('apply', this);
									$(this).fadeIn();
								})
								.attr('src', data.thumb);
						} else { // New item
							var fakeicon = (data.realthumb) ? 1:0;
							var newchild = $('<li rel="' + file + '"><div><div class="imgframe"><img src="' + data.thumb + '" rel="' + fakeicon + '"/></div></div><strong>' + data.title + '</strong></li>');
							newchild
								.click($.gander._itemclick)
								.contextMenu($.gander.options['menu.item'],$.gander.options['menu']);
							list.append(newchild);
							needsort = 1;
						}
					});
					if (needsort)
						$.gander.sort();
					if (couldthumb > 0) { // Still more work to do
						console.log('Refresh complete. Still ' + couldthumb + ' items to load.');
						$.gander.refresh();
						$.gander.growl_update('thumbnailer_info', couldthumb + ' remaining');
					} else if ($('#thumbnailer_info').length > 0) { // Nothing left and we have a dialog to destory
						$.gander.growl_close('thumbnailer_info');
					}
				},
				error: function(e,xhr,exception) {
					$.gander.growl('error', 'Error while refreshing - ' + xhr.responseText + ' - ' + exception);
				}
			});
		},
		/**
		* Apply the sort method to the item list
		* @param string method Optional method to set $.gander.options['sort'] to before we begin. If unspecified the current sort method is used instead
		*/
		sort: function(method) {
			if (method)
				$.gander.options['sort'] = method;
			var parent = $('#list');
			var items = parent.children().get();
			var aval, bval, afol, bfol;
			switch ($.gander.options['sort']) {
				case 'date': // Simple sorts
				case 'size':
				case 'name':
					items.sort(function(a,b) {
						if ($.gander.options['sort'] == 'name') {
							aval = $(a).attr('rel').toLowerCase(); // Case insensitive
							bval = $(b).attr('rel').toLowerCase();
						} else { // Sort by raw data
							aval = $(a).data($.gander.options['sort']);
							bval = $(b).data($.gander.options['sort']);
						}

						if ($.gander.options['sort_folders_first']) {
							afol = ($(a).data('type') == 'dir');
							bfol = ($(b).data('type') == 'dir');
							if (afol && !bfol) {
								return -1;
							} else if (!afol && bfol) {
								return 1;
							}
						}
						return (aval < bval) ? -1 : (aval > bval) ? 1 : 0;
					});
					break;
				case 'random':
					items.sort(function(a,b) {
						var aobj = $(a);
						var bobj = $(b);
						if ($.gander.options['sort_folders_first']) {
							afol = (aobj.data('type') == 'dir');
							bfol = (bobj.data('type') == 'dir');
							if (afol && !bfol) {
								return -1;
							} else if (!afol && bfol) {
								return 1;
							}
						}
						if ($.gander.options['sort_random_selected_first']) {
							if (aobj.attr('rel') == $.gander.current['path']) {
								return -1;
							} else if (bobj.attr('rel') == $.gander.current['path']) {
								return 1;
							}
						}
						return (Math.random > 0.5) ? -1 : 1;
					});
			}
			$.each(items, function(idx, itm) { parent.append(itm) });
		},
		/**
		* Internal function triggered when clicking on an icon
		* This funciton is used by 'cd' and 'refresh' to bind the click event of indidivual items
		*/
		_itemclick: function() {
			$.gander.select($(this).index());
			var path = $(this).attr('rel');
			if (path.substr(-1) == '/') { // Is a directory
				$.gander.cd(path.substr(0,path.length-1));
			} else { // Is a file
				$.gander.viewer('open', path);
			}
		},
		/**
		* Internal function to adjust a numerical value whilst constraining it within a minimum and maximum
		* @param int|float value The value as it currently stands
		* @param int|float adjust The adjustment value to apply
		* @param int|float min The minimum value that the returned value can be
		* @param int|float max The maximum value that the returned value can be
		* @return int|float The initial value with the adjustment applied within the min/max constraints
		*/
		adjust: function(value, adjust, min, max) {
			if (value + adjust > max) {
				return max;
			} else if (value + adjust < min) {
				return min;
			} else {
				return value + adjust;
			}
		},
		/**
		* File selection interface
		* This is primerilly aimed at the main file list navigation
		* @param string|int direction Optional command to give the file handler OR the offset to set the active item to. See the functions switch statement for further details
		*/
		select: function(direction) {
			var offset = $('#list li[rel="' + $.gander.current['path'] + '"]').index();
			var list = $('#list').children();
			var path;
			switch(direction) {
				case 'next':
					if (offset < list.length -1) {
						offset += 1;
					} else
						$.gander.growl('notice', 'End of image list', 'notify-select', {life: 1000});
					break;
				case 'previous':
					if (offset > 0) {
						offset = $.gander.adjust(offset, -1, 0, list.length -1);
					} else
						$.gander.growl('notice', 'Start of image list', 'notify-select', {life: 1000});
					break;
				case '+10':
					offset = $.gander.adjust(offset, +10, 0, list.length -1);
					break;
				case '-10':
					offset = $.gander.adjust(offset, -10, 0, list.length -1);
					break;
				case 'first':
					offset = -1;
					while (offset++ < list.length) { // Avoid folders
						var first = $(list[offset]);
						path = first.attr('rel');
						if (first.data('type') != 'dir')
							break;
					}
					if (offset >= list.length-1) // No selectable items in directory
						offset = -1;
					break;
				case 'last':
					offset = list.length -1;
					break;
				default: // Select a specific offset
					offset = direction;
			}
			// Remove styles from last active image
			$('#list li').removeClass('active');

			// Style the selected item
			var activeimg = $('#list li').eq(offset);
			$.gander.current['path'] = activeimg.attr('rel');
			activeimg.addClass('active');
			$(window).scrollTo($('#list li').eq(offset));
			if ($.gander.viewer('isopen'))
				$.gander.viewer('open', $(list[offset]).attr('rel'));
		},
		/**
		* Tree functionality interface
		* @param string command Optional command to give the tree interface handler. See the inner switch for more details.
		*/
		tree: function(command) {
			switch (command) {
				case 'next': // Go to next sibling
				case 'previous': // Go to previous sinling - next/previous are handled by the same logic
					var children = $('#dirlist').dynatree('getTree').getNodeByKey($.gander.path).getParent().getChildren();
					for (c = 0; c < children.length; c++) {
						if (children[c].data.key == $.gander.path) {
							if (command == 'next' && c+1 < children.length) {
								$.gander.cd(children[c+1].data.key, 1);
							} else if (command == 'previous' && c > 0) {
								$.gander.cd(children[c-1].data.key, 1);
							}
						}
					}
					break;
				case 'in': // Go to first child
					children = $('#dirlist').dynatree('getTree').getNodeByKey($.gander.path).getChildren();
					if (children.length > 0)
						$.gander.cd(children[0].data.key, 1);
					break;
				case 'up': // Go to parent directory
					var parent = $('#dirlist').dynatree('getTree').getNodeByKey($.gander.path).getParent();
					$.gander.cd(parent.data.key, 1);
					break;
			}
		},
		/**
		* Thumbnail functionality interface
		* @param string direction Optional command to give the thumbnail interface handler. See the functions switch statement for further details
		* @param object A specific object to apply the zoom settings to. If omitted all thumbs will be zoomed
		*/
		thumbzoom: function(direction, img) {
			var zoom = $.gander.current['thumbzoom'];
			switch(direction) {
				case 'in':
					zoom = $.gander.adjust(zoom, $.gander.options['zoom_thumb_adjust'], $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
					break;
				case 'out':
					zoom = $.gander.adjust(zoom, 0 - $.gander.options['zoom_thumb_adjust'], $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
					break;
				case 'apply':
					break;
				case 'reset':
				case 'normal':
					zoom = $.gander.options['zoom_thumb_normal'];	
				default: // Accept incomming value as the amount
					zoom = direction;
					zoom = $.gander.adjust(direction, 0, $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
			}
			if (direction != 'apply' && zoom == $.gander.current['thumbzoom']) return;
			$.gander.current['thumbzoom'] = zoom;
			$(img ? img : '#list li img').each(function() {
				var item = $(this);
				if (this.naturalHeight && this.naturalWidth) {
					if (this.naturalHeight > this.naturalWidth) {
						item.attr({height: zoom + 'px', width: (zoom / this.naturalHeight) * this.naturalWidth + 'px'});
					} else {
						item.attr({width: zoom + 'px', height: (zoom / this.naturalWidth) * this.naturalHeight + 'px'});
					}
				}
			});
		},
		/**
		* Image zoom functionality interface
		* @param string direction Optional command to give the zoom interface handler. See the functions switch statement for further details
		* @param string lock Locking status: either 'lock' or anything else. 'lock' applies the zoom method from now onwards
		*/
		zoom: function(direction, lock) {
			var zoom = $.gander.current['zoom'];
			if (lock == 'lock') // Apply from now on?
				$.gander.options['zoom_on_open'] = direction;
			switch(direction) {
				case 'in':
					zoom = $.gander.adjust(zoom, 0 - $.gander.options['zoom_adjust'], $.gander.options['zoom_min'], $.gander.options['zoom_max']);
					break;
				case 'out':
					zoom = $.gander.adjust(zoom, $.gander.options['zoom_adjust'], $.gander.options['zoom_min'], $.gander.options['zoom_max']);
					break;
				case 'fit-width':
				case 'fitwidth':
					zoom = ($('#window-display').width() / $.gander.current['width']) * 100;
					break;
				case 'fit-height':
				case 'fitheight':
					zoom = ($('#window-display').height() / $.gander.current['height']) * 100;
					break;
				case 'fit-both':
				case 'fitboth':
				case 'fit':
					if ($.gander.current['width'] / $('#window-display').width() > $.gander.current['height'] / $('#window-display').height()) {
						return $.gander.zoom('fit-width');
					} else {
						return $.gander.zoom('fit-height');
					}
					//return $.gander.zoom(($.gander.current['width'] > $('#window-display').width()) ? 'fit-width' : 'fit-height');
					break;
				case '100':
				case 'reset':
				case 'normal':
					direction = 100;
				default: // Accept incomming value as the amount
					zoom = $.gander.adjust(direction, 0, $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
			}
			if (!$.gander.options['zoom_stretch_smaller'] && zoom > 100)
				zoom = 100;

			$.gander.current['zoom'] = zoom;
			$('#window-display #display').width($.gander.current['width'] * (zoom/100));
		},
		/**
		* Image viewing area interface
		* @param string cmd Optional command to give the image viewer interface handler. See the functions switch statement for further details
		* @param string path Optional file path used in the 'open' command to open a specific image
		*/
		viewer: function(cmd, path) {
			switch (cmd) {
				case 'hide':
					if ($.gander.options['fullscreen'] == 1 && window.fullScreenApi.supportsFullScreen)
						window.fullScreenApi.cancelFullScreen();
					$('#list').show();
					if ($.gander.current['path'])
						$(window).scrollTo($('#list li[rel="' + $.gander.current['path'] + '"]'));
					$.gander.throbber('off');
					if ($.gander.options['menu_hide_on_view'])
						$('#window-menu').show();
					if ($.gander.options['mouse_hide_on_view'])
						$('body').removeClass('nomouse');
					$('#window-display').hide();
					break;
				case 'toggle':
					$.gander.viewer(($('#window-display').css('display') == 'none') ? 'show' : 'hide');
					break;
				case 'show':
				case 'open': // Open a specific file
					if (!path) // No path specified - figure out the item that should show
						if ($.gander.current['path']) {
							path = $.gander.current['path']; // Copy from current
						} else {
							$.gander.growl('error', 'No image selected');
							return; // No idea what to display
						}
					if (path != $.gander.current['viewing_path']) { // Opening a different file from previously
						if (path in $.gander.cache) { // In cache
							$('#display').load($.gander._displayloaded).attr('src', $.gander.cache[path]);
						} else { // New cache request
							if ( $.gander.options['throb_from_fullscreen'] && ($('#window-display').css('display') == 'none') ) // Hidden already - display throb, otherwise keep previous image
								$.gander.throbber('on');
							if ($.gander.options['media_transmit'] == 0) { // Retrieve as Base64 JSON
								$.getJSON($.gander.options['gander_server'], {cmd: 'get', path: path}, function(json) {
									$.gander._unpack('open', json);
									$('#display').load($.gander._displayloaded).attr('src', json.data);
								});
							} else { // Stream
								$('#display').load($.gander._displayloaded).attr('src', $.gander.options['media_transmit_path'].replace('%p', '/' + path));
							}
						}
						$.gander.current['path'] = path;
						$.gander.current['viewing_path'] = path;
					}
					if ($.gander.options['menu_hide_on_view'])
						$('#window-menu').hide();
					if ($.gander.options['mouse_hide_on_view'])
						$('body').addClass('nomouse');
					$('#list').hide();
					$('#window-display').show();

					// Handle fullscreen options

					if ($.gander.options['fullscreen'] == 1) { // Try for real fullscreen
						if (!window.fullScreenApi.isFullScreen()) {
							if (window.fullScreenApi.supportsFullScreen) {
								window.fullScreenApi.requestFullScreen(document.body);
							} else {
								$.gander.growl('error', 'Your browser does not support fullscreen mode. Forced option "fullscreen = 0" from now on.');
								$.gander.options['fullscreen'] = 0;
							}
						}
					}
					break;
				case 'isopen': // Internal function to query if the viewer is open
					return ($('#window-display').css('display') != 'none');
				default:
					alert('Unknown viewer command: ' + cmd);
				}
		},
		/**
		* Trobber interface
		* @param string cmd Optional command to give the throbber interface handler. See the functions switch statement for further details
		*/
		throbber: function(cmd) {
			switch(cmd) {
				case 'on':
					$('#window-throbber').show();
					break;
				case 'off':
					$('#window-throbber').hide();
					break;
			}
		},
		/**
		* Internal function attached to the onLoad event of the #display picture viewer
		*/
		_displayloaded: function() {
			$.gander.current['width'] = this.naturalWidth;
			$.gander.current['height'] = this.naturalHeight;
			$.gander.zoom($.gander.options['zoom_on_open']);
			$.gander.throbber('off');
		},
		/**
		* Window interface
		*/
		window: function(cmd) {
			switch(cmd) {
				case 'new':
					newwindow=window.open('/','gander','height=450,width=450,screenX=350,screenY=100,scrollbars=yes,menubar=no,location=no,status=no,toolbar=no');
					if (window.focus)
						newwindow.focus();
					break;
				case 'clone':
					newwindow=window.open(window.location,'gander', 'height=' + $(window).height() + ',width=' + $(window).width() + ',screenX=' + ((document.all)?window.screenLeft:window.screenX) + ',screenY=' + ((document.all)?window.screenTop:window.screenY) + ',scrollbars=yes,menubar=no,location=no,status=no,toolbar=no');
					if (window.focus)
						newwindow.focus();
					break;
			}
		}
	}});
	$.gander.init();
	$.gander.cd(window.location.hash ? window.location.hash.substr(1) : '/', 1);
});
