$(function() {
	$.extend({ gander: {
		options: {
			zoom_thumb_adjust: 20,
			zoom_thumb_min: 50,
			zoom_thumb_max: 150,
		},
		current_offset: 0,
		current_zoom: 150,
		cache: {},

		init: function() {
			shortcut.add('a', function() { $.gander.move('previous'); });
			shortcut.add('s', function() { $.gander.move('next'); });
			shortcut.add('z', function() { $.gander.move('first'); });
			shortcut.add('x', function() { $.gander.move('last'); });
			shortcut.add('q', function() { $.gander.zoom('in'); });
			shortcut.add('w', function() { $.gander.zoom('out'); });
			shortcut.add('e', function() { $.gander.zoom('fit'); });
			shortcut.add('f', function() { $.gander.display(); });
			//$('#window-display, #window-list').dialog();
			$('#window-display').hide();

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
		cd: function(path) {
			$.getJSON('/gander.php', {cmd: 'list', path: path}, function(json) {
				var list = $('#list');
				var thumbbed = 0;
				list.empty();
				$.each(json, function(file, data) {
					var newchild = list.append('<li rel="' + file + '"><img src="' + data.thumb + '"/><strong>' + data.title + '</strong></li>');
				});
				$('#list li').click(function() {
					$.gander.current_offset = $(this).index();
					$.gander.display($(this).attr('rel'));
				});
				$.gander.current_offset = 0;
				$.gander.zoom('refresh');
			});
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
			$.gander.display($(list[offset]).attr('rel'));
		},
		zoom: function(direction) {
			var zoom = $.gander.current_zoom;
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
			if (direction != 'refresh' && zoom == $.gander.current_zoom) return;
			$.gander.current_zoom = zoom;
			$('#list li img').attr({width: zoom + 'px', height: zoom + 'px'});
		},
		display: function(path) {
			if (!path) { // No path specified - figure it out
				path = $('#list li').eq($.gander.current_offset).attr('rel');
				alert(path);
			}
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
		}
	}});
	$.gander.init();
	$.gander.cd('/');
	$.gander.zoom(100);
});
