$(function() {
	$.extend({ gander: {
		options: {
			zoom_thumb_adjust: 20,
			zoom_thumb_min: 50,
			zoom_thumb_max: 150,
		},
		current_offset: 0,
		current_thumbzoom: 150,
		current_path: '/',
		cache: {},

		init: function() {
			shortcut.add('a', function() { $.gander.move('previous'); });
			shortcut.add('s', function() { $.gander.move('next'); });
			shortcut.add('z', function() { $.gander.move('first'); });
			shortcut.add('x', function() { $.gander.move('last'); });
			shortcut.add('q', function() { $.gander.thumbzoom('in'); });
			shortcut.add('w', function() { $.gander.thumbzoom('out'); });
			shortcut.add('e', function() { $.gander.thumbzoom('fit'); });
			shortcut.add('f', function() { $.gander.viewer('toggle'); });
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
			$.getJSON('/gander.php', {cmd: 'list', path: path, getthumbs: 0}, function(json) {
				var list = $('#list');
				var makethumb = 0;
				$.gander.current_path = path;
				window.location.hash = path;
				list.empty();
				$.each(json, function(file, data) {
					if (data.makethumb)
						makethumb++;
					var newchild = $('<li rel="' + file + '"><div><img src="' + data.thumb + '"/></div><strong>' + data.title + '</strong></li>');
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
			console.log('REQUEST REFRESH');
			$.getJSON('/gander.php', {cmd: 'list', path: $.gander.current_path, getthumbs: 1, mkthumbs: 1}, function(json) {
				var list = $('#list');
				var makethumb = 0;
				$.each(json, function(file, data) {
					console.log('REFRESH ' + file);
					var existing = $('#list li[rel="' + file + '"]');
					if (existing.length > 0) { // Item already exists
						existing.find('img').attr('src', data.thumb);
					} else { // New item
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
			var adjust_zoom = 10;
			switch(direction) {
				case 'in':
					zoom = $.gander.adjust(zoom, $.gander.options['zoom_thumb_adjust'], $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
					break;
				case 'out':
					zoom = $.gander.adjust(zoom, 0 - $.gander.options['zoom_thumb_adjust'], $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
					break;
				case 'refresh':
					break;
				default: // Accept incomming value as the amount
					zoom = direction;
					zoom = $.gander.adjust(zoom, 0, $.gander.options['zoom_thumb_min'], $.gander.options['zoom_thumb_max']);
			}
			if (direction != 'refresh' && zoom == $.gander.current_thumbzoom) return;
			$.gander.current_thumbzoom = zoom;
			$('#list li img').each(function() {
				var item = $(this);
				item.attr((item.height() > item.width()) ? 'height' : 'width', zoom + 'px');
			});
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
						$('#display').attr('src', $.gander.cache[path]);
					} else { // Fill cache request
						$.getJSON('/gander.php', {cmd: 'get', path: path}, function(data) {
							$('#display').attr('src', data.data);
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
		}
	}});
	$.gander.init();
	$.gander.cd(window.location.hash ? window.location.hash.substr(1) : '/');
});
