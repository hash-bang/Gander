$(function() {
	$.extend({ gander: {


		/**
		* Gander configuration options
		* @var array
		*/
		options: {
			gander_server: 'gander.php',
			max_depth: 99, // Maximum depth of paths (used to prevent infinite loops when scaning hierarchies)
			menu_hide_on_view: 1,
			mouse_hide_on_view: 1,
			sort: 'name', // Sort method. Values: name, random
			sort_folders_first: 1, // Override 'sort' to always display folders first
			sort_reset: 'keep', // Reset the sort method to this when changing dir (set to 'keep' to keep the sort setting)
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
			media_transmit_path: '/pictures/%p'
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
		* Array of paths we are currently viewing
		* The first index is the active path (for folder tree purposes)
		* @var array
		* @see cd()
		*/
		path: ['/'],


		/**
		* Initialization function
		* Should be called once on startup
		*/
		init: function() {
			// Keyboard shortcuts {{{
			key('a', function() { $.gander.select('previous'); });
			key('ctrl+a, shift+a', function() { $.gander.select('-10'); });
			key('s', function() { $.gander.select('next'); });
			key('ctrl+s, shift+s', function() { $.gander.select('+10'); });
			key('z', function() { $.gander.select('first'); });
			key('x', function() { $.gander.select('last'); });
			key('home', function() { $.gander.select('first'); });
			key('end', function() { $.gander.select('last'); });
			key('pageup', function() { $.gander.select('first'); });
			key('pagedown', function() { $.gander.select('last'); });
			key('left', function() { $.gander.select('previous'); });
			key('right', function() { $.gander.select('next'); });
			key('space', function() { $.gander.select('next'); });

			// Zooms
			key('w, +', function() { $.gander.zoom('in'); });
			key('q, -', function() { $.gander.zoom('out'); });
			key('e', function() { $.gander.zoom('fit'); });
			key('r', function() { $.gander.zoom('reset'); });

			// Move within tree
			key('ctrl+left, shift+left', function() { $.gander.tree('up'); });
			key('ctrl+right, shift+right', function() { $.gander.tree('in'); });
			key('ctrl+up, shift+up', function() { $.gander.tree('previous'); });
			key('ctrl+down, shift+down', function() { $.gander.tree('next'); });

			// Viewer
			key('f', function() { $.gander.viewer('toggle'); });
			key('escape', function() { $.gander.viewer('hide'); });

			// Sort modes
			key('t', function() { $.gander.sort('random'); });
			key('shift+t', function() { $.gander.sort('name'); });
			key('ctrl+t', function() { $.gander.sort('date'); });

			// Window controls
			key('n', function() { $.gander.window('clone'); });
			// }}}
			// Menus {{{
			// Item in list
			$.contextMenu({
				selector: '#window-list #list > li.image',
				items: {
					'refresh': {name: 'Refresh', icon: 'refresh', callback: function() { $.gander.refresh(); }},
					"sep1": "---------",
					'go_to_top': {name: 'Go to top', icon: 'top', callback: function() { $.gander.select('first'); }},
					'go_to_bottom': {name: 'Go to bottom', icon: 'bottom', callback: function() { $.gander.select('last'); }},
				}
			});

			// Item in list (folders)
			$.contextMenu({
				selector: '#window-list #list > li.folder',
				items: {
					'open': {name: 'Open', icon: 'folder', onclick: function() { $.gander.viewer('open', $(this).attr('rel')); }},
					'open_recursive': {name: 'Open Recursive', icon: 'folder-recurse', callback: function() { $.gander.viewer('open', $(this).attr('rel'), 1); }},
					'fullscreen': {name: 'Fullscreen', icon: 'fullscreen', callback: function() { $.gander.viewer('open', $(this).attr('rel')); }},
					"sep1": "---------",
					'refresh': {name: 'Refresh', icon: 'refresh', callback: function() { $.gander.refresh(); }},
					"sep2": "---------",
					'go_to_top': {name: 'Go to top', icon: 'top', callback: function() { $.gander.select('first'); }},
					'go_to_bottom': {name: 'Go to bottom', icon: 'bottom', callback: function() { $.gander.select('last'); }},
				}
			});

			// Folder tree item
			$.contextMenu({
				selector: '#window-dir #dirlist > ul li',
				position: function(m) {
					var label = m.$trigger.find('.dynatree-node').first();
					m.$menu.css({
						left: label.offset().left + 20,
						top: label.offset().top + label.height()
					});
				},
				items: {
					'open': {name: 'Open', icon: 'folder-open', callback: function() { $.gander.cd($.gander._dynapath(this)); }},
					'open_recursive': {name: 'Open Recursive', icon: 'folder-recurse', callback: function() {
						$.gander.cd($.gander._dynapath(this), {recurse: 1});
					}},
					'open_recuseive_rand': {name: 'Open Recursive (+Shuffle)', icon: 'folder-recurse', callback: function() {
						$.gander.sort('random');
						$.gander.cd($.gander._dynapath(this), {recurse: 1});
					}},
					'open_add': {name: 'Add to view', icon: 'folder-add', callback: function() {
						$.gander.cd($.gander._dynapath(this), {append: 1});
					}},
					"sep1": "---------",
					'home': {name: 'Home', icon: 'home', callback: function() { $.gander.cd('/'); }},
					"sep2": "---------",
					'go_up': {name: 'Go up', icon: 'up', callback: function() { $.gander.tree('up'); }},
					'next_dir': {name: 'Next dir', icon: 'next', callback: function() { $.gander.tree('next'); }},
					'previous_dir': {name: 'Previous dir', icon: 'previous', callback: function() { $.gander.tree('previous'); }},
				}
			});

			// Active image
			$.contextMenu({
				selector: '#window-display',
				items: {
					'close': {name: 'Close', icon: 'list', callback: function() { $.gander.viewer('hide'); }},
					"sep1": "---------",
					'Next': {name: 'Next', icon: 'next', callback: function() { $.gander.select('next'); }},
					'Previous': {name: 'Previous', icon: 'previous', callback: function() { $.gander.select('previous'); }},
					"sep2": "---------",
					'Zoom to 100%': {name: 'Zoom to 100%', icon: 'zoom-actual', callback: function() { $.gander.zoom('normal', 'lock'); }},
					'Zoom fit': {name: 'Zoom fit', icon: 'zoom-fit', callback: function() { $.gander.zoom('fit', 'lock'); }},
					'Zoom fit width': {name: 'Zoom fit width', icon: 'zoom-fit-width', callback: function() { $.gander.zoom('fit-width', 'lock'); }},
					'Zoom fit height': {name: 'Zoom fit height', icon: 'zoom-fit-height', callback: function() { $.gander.zoom('fit-height', 'lock'); }},
				}
			});

			// Main menu - Go
			$.contextMenu({
				selector: '#window-menu > #menu-go',
				trigger: 'left',
				position: function(m) {m.$menu.css({left: m.$trigger.offset().left, top: m.$trigger.offset().top + m.$trigger.height() + 10});},
				items: {
					'home': {name: 'Home', icon: 'home', callback: function() { $.gander.cd('/'); }},
					"sep1": "---------",
					'go_up': {name: 'Go up', icon: 'up', callback: function() { $.gander.tree('up'); }},
					'next_dir': {name: 'Next dir', icon: 'next', callback: function() { $.gander.tree('next'); }},
					'previous_dir': {name: 'Previous dir', icon: 'previous', callback: function() { $.gander.tree('previous'); }},
				}
			});

			// Main menu - Select
			$.contextMenu({
				selector: '#window-menu > #menu-select',
				trigger: 'left',
				position: function(m) {m.$menu.css({left: m.$trigger.offset().left, top: m.$trigger.offset().top + m.$trigger.height() + 10});},
				items: {
					'first': {name: 'First', icon: 'first', callback: function() { $.gander.select('first'); }},
					'previous': {name: 'Previous', icon: 'previous', callback: function() { $.gander.select('previous'); }},
					'next': {name: 'Next', icon: 'next', callback: function() { $.gander.select('next'); }},
					'last': {name: 'Last', icon: 'last', callback: function() { $.gander.select('last'); }},
					"sep1": "---------",
					'back_10': {name: 'Jump backwards 10', icon: 'back_fast', callback: function() { $.gander.select('-10'); }},
					'next_10': {name: 'Jump forewards 10', icon: 'next_fast', callback: function() { $.gander.select('+10'); }},
				}
			});

			// Main menu - Zoom
			$.contextMenu({
				selector: '#window-menu > #menu-zoom',
				trigger: 'left',
				position: function(m) {m.$menu.css({left: m.$trigger.offset().left, top: m.$trigger.offset().top + m.$trigger.height() + 10});},
				items: {
					'zoom_in': {name: 'Zoom in', icon: 'zoom-in', callback: function() { $.gander.zoom('in'); }},
					'zoom_out': {name: 'Zoom out', icon: 'zoom-out', callback: function() { $.gander.zoom('out'); }},
					'zoom_to_100': {name: 'Zoom to 100%', icon: 'zoom-actual', callback: function() { $.gander.zoom('normal', 'lock'); }},
					'zoom_fit': {name: 'Zoom fit', icon: 'zoom-fit', callback: function() { $.gander.zoom('fit', 'lock'); }},
					'zoom_fit_width': {name: 'Zoom fit width', icon: 'zoom-fit-width', callback: function() { $.gander.zoom('fit-width', 'lock'); }},
					'zoom_fit_height': {name: 'Zoom fit height', icon: 'zoom-fit-height', callback: function() { $.gander.zoom('fit-height', 'lock'); }},
				}
			});

			// Main menu - Sort
			$.contextMenu({
				selector: '#window-menu > #menu-sort',
				trigger: 'left',
				build: function() {
					return {
						position: function(m) {m.$menu.css({left: m.$trigger.offset().left, top: m.$trigger.offset().top + m.$trigger.height() + 10});},
						items: {
							'sort_name': {name: 'By name', icon: ($.gander.options['sort'] == 'name' ? 'menu-chosen' : null), callback: function() { $.gander.sort('name'); }},
							'sort_date': {name: 'By date', icon: ($.gander.options['sort'] == 'date' ? 'menu-chosen' : null), callback: function() { $.gander.sort('date'); }},
							'sort_size': {name: 'By size', icon: ($.gander.options['sort'] == 'size' ? 'menu-chosen' : null), callback: function() { $.gander.sort('size'); }},
							"sep1": "---------",
							'sort_random': {name: 'Shuffle', icon: ($.gander.options['sort'] == 'random' ? 'menu-chosen' : null), callback: function() { $.gander.sort('random'); }},
						}
					};
				}
			});
			/// }}}

			// NO CONFIG BEYOND THIS LINE

			// Default values
			$.gander.current['thumbzoom'] = $.gander.options['zoom_thumb_normal'];

			// Window setup
			//$('#window-display, #window-list').dialog();
			//$('#window-dir #dirlist').touchScroll({scrollHeight: 10000});
			$('#window-display').hide();
			$('#window-display #display, #window-display').click(function() { $.gander.viewer('hide'); });

			// Scrollers
			$('#window-list, #window-dir').jScrollPane({
				enableKeyboardNavigation: false,
				hideFocus: true,
				clickOnTrack: false
			});

			// Event bindings {{{
			$(window).resize(function() { $.gander.window('resize') });
			$(document).bind('mousewheel', function(event, delta) {
				if ($.gander.viewer('isopen')) { // Only capture if we are viewing
					$.gander.select(delta > 0 ? 'previous' : 'next');
					return false;
				}
			});
			$(document).on('click', '.jGrowl', function() { // When clicking on a jGrowl popup - kill it
				$(this).jGrowl('close');
			});
			$('#window-list #list').on('click', 'li', function() {
				var item = $(this);
				$.gander.select(item.index());
				if (item.hasClass('image')) { // Is an image
					$.gander.viewer('open', item.attr('rel'));
				} else if (item.hasClass('folder')) { 
					$.gander.cd(item.attr('rel'), {drawtree: 1});
				} else { // Is unknown
					alert('I dont know how to handle this file');
				}
			});
			// }}}

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
							$.gander.window('resize-dir');
						}
					});
				},
				onExpand: function(flag, node) {
					$.gander.window('resize-dir');
				},
				onClick: function(node) {
					if (node.getEventTargetType(event) != "expander")
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
			$.gander.window('resize');

			$.ajax({
				url: $.gander.options['gander_server'], 
				dataType: 'json',
				type: 'POST',
				data: {cmd: 'init'},
				success: function(json) {
					$.gander._unpack('init', json);
					$.gander.options = $.extend($.gander.options, json.data);
					$.gander.cd(window.location.hash ? window.location.hash.substr(1) : '/', {drawtree: 1});
				},
				error: function(e,xhr,exception) {
					$.gander.growl('error', 'Error during init - ' + xhr.responseText + ' - ' + exception);
				}
			});
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
			var opts = $.extend($.gander.options['jGrowl'], options);
			if (id && $('#' + id).length > 0) // Assign an ID but this ID already exists - abort
				return;
			opts['open'] = function(e,m,o) {
				if (id)
					e.find('.jGrowl-message').attr('id', id);
				if (type)
					e.find('.jGrowl-header').append('<img src="images/growl/' +  type + '.png"/>');
			};
			$.jGrowl(text, opts);
			if (id && options['life']) // HOTFIX: For some reason Growl doesnt kill certain messages on time - add a setTimeout event to make sure
				setTimeout(function() {
					console.log('Growl killer: ' + id);
					$.gander.growl_close(id);
				}, options['life']);
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
			$('#' + id).parents('.jGrowl-notification').fadeOut('fast', function() { $(this).remove(); });
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
				if (path.substr(0,1) == '#') // Clip '#' prefix if it exists
					path = path.substr(1);
				var fullpath = '';
				$.gander._cdtreebits = $.map(path.split('/'), function(i) {
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
		* Returns the full path of a document element in a Dynatree
		* FIXME: I'm sure there is a more efficient way of doing this but ui.getNode doesnt seem to work
		* @param object The object to get the path of
		* @return string The Gander path of the given item
		*/
		_dynapath: function(o) {
			var path = [];
			var obj = $(o).first();
			var depth = 0;
			while(obj.length) {
				path.unshift(obj.find('.dynatree-title').first().text());
				obj = $(obj).parents('li').first();
				if (depth++ >= $.gander.options.max_depth)
					break;
			}
			path.shift(); // Remove first element (root)
			return '/' + path.join('/');
		},


		/**
		* Change the file list to a given path
		* This also refreshes the file list contents as loads thumbnails as needed
		* @param string path The new path to change the file list to
		* @param array options Array of extra options to pass
		*/
		cd: function(path, options) {
			var opts = $.extend({
				append: 0, // Whether to append the newly loaded list to the view (if 0 the view is overwritten)
				resurse: 0, // Whether to recurse into the directory
				drawtree: 0, // Whether to refresh the folder tree as well
			}, options);
			$.ajax({
				url: $.gander.options['gander_server'], 
				dataType: 'json',
				type: 'POST',
				data: {
					cmd: 'list',
					path: path,
					thumbs: 'quick',
					max_thumbs: $.gander.options['thumbs_max_get_first'],
					recursive: opts['recurse'],
					sort: $.gander.options['sort_reset']
				},
				success: function(json) {
					$.gander._unpack('cd', json);

					var list = $('#list');
					var couldthumb = 0; // How many thumbs there are left to load
					if (!opts['append']) {
						if (json.header.paths) // Read paths back from server
							$.gander.path = json.header.paths;
						list.empty();
					} else if (json.header.paths) // Append paths from server
						$.gander.path = $.gander.path.concat(json.header.paths);

					window.location.hash = path;

					$.each(json.list, function(file, data) {
						if (data.couldthumb)
							couldthumb++;
						var fakeicon = (data.realthumb) ? 1:0;
						var newchild = $('<li rel="' + file + '"><div><div class="imgframe"><img rel="' + fakeicon + '"/></div></div><strong>' + data.title + '</strong><div class="emblems"></div></li>');
						newchild
							.data({
								size: data.size,
								date: data.date,
								type: data.type,
							})
							.addClass(data.type == 'dir' ? 'folder' : (data.type == 'image' ? 'image' : 'other'))
							.find('img')
								.load(function() { $(this).hide(); $.gander.thumbzoom('apply', this); $(this).fadeIn(); $(this).parent('li').css('background', ''); })
								.attr('src', data.thumb);
						list.append(newchild);

						// MC - Testing code for cache
						//newchild.prepend('<img class="cached" src="images/icons/avi.png"/>');
					});
					$.gander.sort($.gander.options['sort_reset']);
					$.gander.current['path'] = null;
					$.gander.select('first');
					$.gander.window('resize');
					if (couldthumb > 0) { // Still more work to do
						setTimeout($.gander.refresh, 0);
						$.gander.growl('thumbnails', couldthumb + ' remaining', 'thumbnailer_info', {header: 'Creating thumbnails', sticky: 1});
					}
					if (opts['drawtree'])
						$.gander._cdtree($.gander.path[0]);
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
				data: {
					cmd: 'list',
					path: $.gander.path.join(';'),
					thumbs: 'make',
					max_thumbs: $.gander.options['thumbs_max_get_first'],
					skip: skip,
					sort: $.gander.options['sort']
				},
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
							console.log('Rejected icon thumnail for non-existant item: ' + file);
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
			if (method && method != 'keep')
				$.gander.options['sort'] = method;
			var aval, bval, afol, bfol;
			switch ($.gander.options['sort']) {
				case 'date': // Simple sorts
				case 'size':
				case 'name':
					$('#list > li').sortElements(function(a,b) {
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
					$('#list > li').sortElements(function(a,b) {
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
						return (Math.random() > 0.5) ? -1 : 1;
					});
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
				case 'reselect':
					// Internal function to force reselection
					// This is usually used when exiting view mode and we need to redraw what is currently selected
					break;
				case 'next':
					if (offset < list.length -1) {
						offset += 1;
					} else
						$.gander.growl('notice', 'End of image list', 'notify-select', {life: 2000});
					break;
				case 'previous':
					if (offset > 0) {
						offset = $.gander.adjust(offset, -1, 0, list.length -1);
					} else
						$.gander.growl('notice', 'Start of image list', 'notify-select', {life: 2000});
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
			var active = $('#list li').eq(offset);

			var pane = $('#window-list').data('jsp');
			if (pane)
				pane.scrollTo(active.position().left, active.position().top);

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
				case 'previous': // Go to previous sibling - next/previous are handled by the same logic
					var children = $('#dirlist').dynatree('getTree').getNodeByKey($.gander.path[0]).getParent().getChildren();
					for (c = 0; c < children.length; c++) {
						if (children[c].data.key == $.gander.path[0]) {
							if (command == 'next' && c+1 < children.length) {
								$.gander.cd(children[c+1].data.key, {drawtree: 1});
							} else if (command == 'previous' && c > 0) {
								$.gander.cd(children[c-1].data.key, {drawtree: 1});
							}
						}
					}
					break;
				case 'in': // Go to first child
					children = $('#dirlist').dynatree('getTree').getNodeByKey($.gander.path[0]).getChildren();
					if (children.length > 0)
						$.gander.cd(children[0].data.key, {drawtree: 1});
					break;
				case 'up': // Go to parent directory
					var parent = $('#dirlist').dynatree('getTree').getNodeByKey($.gander.path[0]).getParent();
					$.gander.cd(parent.data.key, {drawtree: 1});
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
					$('#window-display').hide();
					$('#list').show();
					$.gander.select('reselect');
					$.gander.throbber('off');
					if ($.gander.options['menu_hide_on_view'])
						$('#window-menu').show();
					if ($.gander.options['mouse_hide_on_view'])
						$('body').removeClass('nomouse');
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
						if ( $.gander.options['throb_from_fullscreen'] && ($('#window-display').css('display') == 'none') ) // Hidden already - display throb, otherwise keep previous image
							$.gander.throbber('on');
						if ($.gander.options['media_transmit'] == 0) { // Retrieve as Base64 JSON
							$.ajax({
								url: $.gander.options['gander_server'],
								dataType: 'json',
								type: 'POST',
								data: {
									cmd: 'get',
									path: path,
								},
								success: function(json) {
									$.gander._unpack('open', json);
									$('#display').load($.gander._displayloaded).attr('src', json.data);
								}
							});
						} else { // Stream
							$('#display').load($.gander._displayloaded).attr('src', $.gander.options['media_transmit_path'].replace('%p', '/' + path));
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
		* Throbber interface
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
				case 'resize':
					$.gander.zoom($.gander.options['zoom_on_open']);
					$.gander.window('resize-list');
					$.gander.window('resize-dir');
					break;
				case 'resize-list':
					// Lazy resize of the file list
					$('#window-list').css('height', $(window).height());
					var pane = $('#window-list').data('jsp');
					if (pane)
						pane.reinitialise();
					break;
				case 'resize-dir':
					// Lazy resize for the dir tree
					$('#window-dir').css('height', $(window).height() - 50);
					var pane = $('#window-dir').data('jsp');
					if (pane)
						pane.reinitialise();
					break;
			}
		}
	}});
	$.gander.init();
});
