$(function() {
	$.extend({ gander: {
		/**
		* Gander configuration options
		* @var array
		*/
		options: {
			gander_server: 'gander.php',
			zoom_thumb_normal: 150,
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
			shortcut.add('s', function() { $.gander.select('next'); });
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
			shortcut.add('ctrl+up', function() { $.gander.zoom('in'); });
			shortcut.add('ctrl+down', function() { $.gander.zoom('out'); });

			// Viewer
			shortcut.add('f', function() { $.gander.viewer('toggle'); });
			shortcut.add('escape', function() { $.gander.viewer('hide'); });

			shortcut.add('n', function() { $.gander.window('clone'); });

			// Menus
			// See http://www.javascripttoolbox.com/lib/contextmenu/ for syntax
			$.gander.options['menu.item'] = [
				{'Open':{icon: 'images/menus/open.png', onclick: function() { $.gander.viewer('open', $(this).attr('rel')); }}},
				{'Fullscreen':{icon: 'images/menus/fullscreen.png', onclick: function() { $.gander.viewer('open', $(this).attr('rel')); }}},
			];
			$.gander.options['menu.list'] = [
				{'Refresh':{icon: 'images/menus/refresh.png', onclick: function() { $.gander.refresh(); }}},
			];
			$.gander.options['menu.tree'] = [
				{'Home':{icon: 'images/menus/home.png', onclick: function() { $.gander.cd('/'); }}},
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

			// Filetree setup
			$('#dirlist').dynatree({
				minExpandLevel: 1,
				imagePath: '/js/jquery.dynatree.skin/',
				clickFolderMode: 3,
				selectMode: 1,
				idPrefix: "dynatree-id-",
				fx: { height: 'toggle', duration: 200 },
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
			// FIXME: type is currently ignored
			var opts = $.gander.options['jGrowl'];
			if (id) {
				if ($('#' + id).length > 0) {
					return;
				}
				opts['open'] = function(e,m,o) {
					e.find('.jGrowl-message').attr('id', id);
				};
			}
			if (options)
				opts = $.extend(opts, options);
			$.jGrowl('<img src="images/growl/' +  type + '.png"/>' + text, opts);
			$('.jGrowl').click(function() {
				$(this).jGrowl('close');
			});
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
			if (json.header && json.header.errors && json.header.errors.length > 0) {
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
						node.focus();
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
		* @param callback callback The callback to call after the directory change
		*/
		cd: function(path, success) {
			$.getJSON($.gander.options['gander_server'], {cmd: 'list', path: path, thumbs: 1, max_thumbs: $.gander.options['thumbs_max_get_first']}, function(json) {
				$.gander._unpack('cd', json);
				var list = $('#list');
				var makethumb = 0; // How many thumbs there are left to load
				if (path.substr(0,1) != '/')
					path = '/' + path;
				$.gander.path = path;
				window.location.hash = path;

				list.empty();
				$.each(json.list, function(file, data) {
					if (data.makethumb)
						makethumb++;
					var fakeicon = (data.realthumb) ? 1:0;
					var newchild = $('<li rel="' + file + '"><div><div class="imgframe"></div></div><strong>' + data.title + '</strong><div class="emblems"></div></li>');
					newchild
						.click($.gander._itemclick)
						.contextMenu($.gander.options['menu.item'],$.gander.options['menu']);
					var img = $('<img/>', {src: data.thumb, rel: fakeicon}).load(function() { $.gander.thumbzoom('apply', this); });
					newchild.find('.imgframe').append(img);
					list.append(newchild);
				});
				$.gander.current['offset'] = -1;
				$.gander.select('first');
				if (makethumb > 0) { // Still more work to do
					setTimeout($.gander.refresh, 0);
					$.gander.growl('thumbnails', makethumb + ' remaining', 'thumbnailer_info', {header: 'Creating thumbnails', sticky: 1});
				}
				if (success)
					success();
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
				data: {cmd: 'list', path: $.gander.path, thumbs: 1, mkthumbs: 1, max_thumbs: $.gander.options['thumbs_max_get_first'], skip: skip},
				success: function(json) {
					$.gander._unpack('refresh', json);
					var list = $('#list');
					var makethumb = 0;
					$.each(json.list, function(file, data) {
						if (data.makethumb)
							makethumb++;
						var existing = $('#list li[rel="' + file + '"]');
						if (existing.length > 0) { // Item already exists
							existing.find('img').attr('src', data.thumb).load(function() {
								$.gander.thumbzoom('apply', this);
							});
						} else { // New item
							console.log('FIXME: ADDED NEW FILE ' + file);
							var fakeicon = (data.realthumb) ? 1:0;
							var newchild = $('<li rel="' + file + '"><div><div class="imgframe"><img src="' + data.thumb + '" rel="' + fakeicon + '"/></div></div><strong>' + data.title + '</strong></li>');
							newchild.click($.gander._itemclick).contextMenu($.gander.options['menu.item'],$.gander.options['menu']);
							list.append(newchild);
							// FIXME: new icons will not be in their correctly sorted place
						}
					});
					if (makethumb > 0) { // Still more work to do
						console.log('REFRESH. Still ' + makethumb + ' items to do. Re-refresh');
						$.gander.refresh();
						$.gander.growl_update('thumbnailer_info', makethumb + ' remaining');
					} else if ($('#thumbnailer_info').length > 0) { // Nothing left and we have a dialog to destory
						$.gander.growl_close('thumbnailer_info');
					}
				},
				error: function(e,xhr,exception) {
					$.gander.growl('Critical', 'Error while refreshing - ' + xhr.responseText + ' - ' + exception);
				}
			});
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
			var offset = $.gander.current['offset'];
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
				case 'first':
					offset = -1;
					while (offset++ < list.length) { // Avoid folders
						path = $(list[offset]).attr('rel');
						if (path.substr(path.length-1) != '/')
							break;
					}
					break;
				case 'last':
					offset = list.length -1;
					break;
				default: // Select a specific offset
					offset = direction;
			}
			if (offset == $.gander.current['offset'])
				return;
			// Remove styles from last active image
			if (offset > -1)
				$('#list li').eq($.gander.current['offset']).removeClass('active');

			$.gander.current['offset'] = offset;

			// Style the selected item
			var activeimg = $('#list li').eq(offset);
			activeimg.addClass('active');
			$('#window-list').scrollTo(activeimg);
			if ($.gander.viewer('isopen'))
				$.gander.viewer('open', $(list[offset]).attr('rel'));
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
					return $.gander.zoom(($.gander.current['width'] > $.gander.current['height']) ? 'fit-width' : 'fit-height');
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

			if (zoom == $.gander.current['zoom']) return;
			$.gander.current['zoom'] = zoom;
			console.log("Z: " + $.gander.current['zoom'] + ", W: " + ($.gander.current['width'] * (zoom/100)) + ", H: " + ($.gander.current['height'] * (zoom/100)));
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
					$('#window-display').hide();
					break;
				case 'toggle':
					$.gander.viewer(($('#window-display').css('display') == 'none') ? 'show' : 'hide');
					break;
				case 'show':
				case 'open': // Open a specific file
					if (!path) // No path specified - figure out the item that should show
						path = $('#list li').eq($.gander.current['offset']).attr('rel');
					if (path != $.gander.current['path']) { // Opening a differnt file from previously
						if (path in $.gander.cache) { // In cache
							$('#display').load($.gander._displayloaded).attr('src', $.gander.cache[path]);
						} else { // Fill cache request
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
					}
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
	$.gander.cd(window.location.hash ? window.location.hash.substr(1) : '/', function() {
		$.gander._cdtree($.gander.path);
	});
});
