$(function() {
	$.extend({ gander: {
		options: {
			zoom_thumb_normal: 150,
			zoom_thumb_adjust: 20,
			zoom_thumb_min: 50,
			zoom_thumb_max: 150,
			zoom_adjust: 10,
			zoom_min: 10,
			zoom_max: 1000,
			thumbs_max_get_first: 0, // Maximum number of thumbs to request on first sweep, set to 0 for all
			thumbs_max_get: 10, // Subsequent number of thumbs per request
		},
		current_offset: 0,
		current_thumbzoom: 150, // Inherited from zoom_thumb_normal during init()
		current_path: '/',
		current_zoom: 100,
		current_width: 0,
		current_height: 0,
		cache: {},

		init: function() {
			// Navigation
			shortcut.add('a', function() { $.gander.move('previous'); });
			shortcut.add('s', function() { $.gander.move('next'); });
			shortcut.add('z', function() { $.gander.move('first'); });
			shortcut.add('x', function() { $.gander.move('last'); });

			// Zooms
			/*shortcut.add('Ctrl+q', function() { $.gander.thumbzoom('in'); });
			shortcut.add('Ctrl+w', function() { $.gander.thumbzoom('out'); });
			shortcut.add('Ctrl+e', function() { $.gander.thumbzoom('fit'); });
			shortcut.add('Ctrl+r', function() { $.gander.thumbzoom('reset'); }); */
			shortcut.add('q', function() { $.gander.zoom('in'); });
			shortcut.add('w', function() { $.gander.zoom('out'); });
			shortcut.add('e', function() { $.gander.zoom('fit'); });
			shortcut.add('r', function() { $.gander.zoom('reset'); });

			// Viewer
			shortcut.add('f', function() { $.gander.viewer('toggle'); });


			// Default values
			$.gander.current_thumbzoom = $.gander.options['zoom_thumb_normal'];

			// Window setup
			//$('#window-display, #window-list').dialog();
			$('#window-display').hide();
			$('#window-display #display').click(function() { $.gander.viewer('hide'); });

			$('#dirlist').dynatree({
				imagePath: '/js/jquery.dynatree.skin/',
				selectMode: 1,
				fx: { height: 'toggle', duration: 200 },
				initAjax: {
					url: '/gander.php?cmd=tree',
				},
				onLazyRead: function(node) {
					node.appendAjax({
						url: '/gander.php?cmd=tree',
						data: { path: node.data.key }
					});
				},
				onClick: function(node) {
					$.gander.cd(node.data.key);
				},
				strings: {
					loading: "Loading directory contents...",
					loadError: "Load error!"
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
		cd: function(path) {
			$.getJSON('/gander.php', {cmd: 'list', path: path, thumbs: 1, max_thumbs: $.gander.options['thumbs_max_get_first']}, function(json) {
				var list = $('#list');
				var makethumb = 0;
				$.gander.current_path = path;
				window.location.hash = path;
				list.empty();
				$.each(json, function(file, data) {
					if (data.makethumb)
						makethumb++;
					var newchild = $('<li rel="' + file + '"><div><div class="imgframe"><img src="' + data.thumb + '"/></div></div><strong>' + data.title + '</strong></li>');
					newchild.click($.gander._itemclick);
					list.append(newchild);
				});
				$.gander.current_offset = 0;
				$.gander.thumbzoom('refresh');
				if (makethumb > 0) // Still more work to do
					$.gander.refresh();
			});
		},
		/**
		* Similar to 'cd' except this funciton tries to redraw an existing file store
		* Usually used when refreshing thumbnails
		*/
		refresh: function() {
			$.getJSON('/gander.php', {cmd: 'list', path: $.gander.current_path, thumbs: 1, mkthumbs: 1, max_thumbs: $.gander.options['thumbs_max_get_first']}, function(json) {
				var list = $('#list');
				var makethumb = 0;
				$.each(json, function(file, data) {
					var existing = $('#list li[rel="' + file + '"]');
					if (existing.length > 0) { // Item already exists
						existing.find('img').attr('src', data.thumb);
					} else { // New item
						console.log('FIXME: ADDED NEW FILE ' + file);
						var newchild = $('<li rel="' + file + '"><img src="' + data.thumb + '"/><strong>' + data.title + '</strong></li>');
						newchild.click($.gander._itemclick);
						list.append(newchild);
						// FIXME: new icons will not be in their correctly sorted place
					}
				});
				if (makethumb > 0) { // Still more work to do
					console.log('REFRESH. Still ' + makethumb + ' items to do. Re-refresh');
					$.gander.refresh();
				}
			});
		},
		/**
		* Internal function triggered when clicking on an icon
		* This funciton is used by 'cd' and 'refresh' to bind the click event of indidivual items
		*/
		_itemclick: function() {
			$.gander.current_offset = $(this).index();
			var path = $(this).attr('rel');
			if (path.substr(-1) == '/') { // Is a directory
				$.gander.cd(path.substr(0,path.length-1));
			} else { // Is a file
				$.gander.viewer('open', path);
			}
		},
		adjust: function(value, adjust, min, max) {
			if (value + adjust > max) {
				return max;
			} else if (value + adjust < min) {
				return min;
			} else {
				return value + adjust;
			}
		},
		move: function(direction) {
			var offset = $.gander.current_offset;
			var list = $('#list').children();
			switch(direction) {
				case 'next':
					offset = $.gander.adjust(offset, 1, 0, list.length -1);
					break;
				case 'previous':
					offset = $.gander.adjust(offset, -1, 0, list.length -1);
					break;
				case 'first':
					offset = 0;
					break;
				case 'last':
					offset = list.length -1;
			}
			if (offset == $.gander.offset)
				return;
			$.gander.current_offset = offset;
			if ($.gander.viewer('isopen'))
				$.gander.viewer('open', $(list[offset]).attr('rel'));
		},
		thumbzoom: function(direction) {
			var zoom = $.gander.current_thumbzoom;
			switch(direction) {
				case 'in':
					zoom = $.gander.adjust(zoom, $.gander.options['zoom_thumb_adjust'], $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
					break;
				case 'out':
					zoom = $.gander.adjust(zoom, 0 - $.gander.options['zoom_thumb_adjust'], $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
					break;
				case 'refresh':
					break;
				case 'reset':
				case 'normal':
					zoom = $.gander.options['zoom_thumb_normal'];	
				default: // Accept incomming value as the amount
					zoom = direction;
					zoom = $.gander.adjust(direction, 0, $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
			}
			if (direction != 'refresh' && zoom == $.gander.current_thumbzoom) return;
			$.gander.current_thumbzoom = zoom;
			$('#list li img').each(function() {
				var item = $(this);
				item.attr((this.naturalHeight > this.naturalWidth) ? 'height' : 'width', zoom + 'px');
			});
		},
		zoom: function(direction) {
			var zoom = $.gander.current_zoom;
			switch(direction) {
				case 'in':
					zoom = $.gander.adjust(zoom, 0 - $.gander.options['zoom_adjust'], $.gander.options['zoom_min'], $.gander.options['zoom_max']);
					break;
				case 'out':
					zoom = $.gander.adjust(zoom, $.gander.options['zoom_adjust'], $.gander.options['zoom_min'], $.gander.options['zoom_max']);
					break;
				case 'fit':
					console.log('FIXME: Zoom to fit feature not yet built');
					break;
				case 'reset':
				case 'normal':
					direction = 100;
				default: // Accept incomming value as the amount
					zoom = $.gander.adjust(direction, 0, $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
			}
			if (zoom == $.gander.current_zoom) return;
			$.gander.current_zoom = zoom;
			console.log("Z: " + $.gander.current_zoom + ", W: " + ($.gander.current_width * (zoom/100)) + ", H: " + ($.gander.current_height * (zoom/100)));
			$('#window-display #display').width($.gander.current_width * (zoom/100));
		},
		viewer: function(cmd, path) {
			switch (cmd) {
				case 'hide':
					$('#window-display').hide();
					break;
				case 'toggle':
					$.gander.viewer(($('#window-display').css('display') == 'none') ? 'show' : 'hide');
					break;
				case 'show':
				case 'open': // Open a specific file
					if (!path) // No path specified - figure out the item that should show
						path = $('#list li').eq($.gander.current_offset).attr('rel');
					$('#list li').removeClass('image-viewing');
					if (path in $.gander.cache) { // In cache
						$('#display').load($.gander._displayloaded).attr('src', $.gander.cache[path]);
					} else { // Fill cache request
						if ($('#window-display').css('display') == 'none') // Hidden already - display throb, otherwise keep previous image
							$('#display').attr('src', '/images/throb.gif');
						$.getJSON('/gander.php', {cmd: 'get', path: path}, function(data) {
							$('#display').load($.gander._displayloaded).attr('src', data.data);
						});
					}
					$('#window-display').show();
					$('#list li[rel="' + path + '"]').addClass('image-viewing');
					break;
				case 'isopen': // Internal function to query if the viewer is open
					return ($('#window-display').css('display') != 'none');
				default:
					alert('Unknown viewer command: ' + cmd);
				}
		},
		_displayloaded: function() { // Internal function attached to the onLoad event of the #display picture viewer
			$.gander.current_width = this.naturalWidth;
			$.gander.current_height = this.naturalHeight;
			$.gander.current_zoom = 100;
		}
	}});
	$.gander.init();
	$.gander.cd(window.location.hash ? window.location.hash.substr(1) : '/');
});
