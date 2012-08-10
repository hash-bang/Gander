<? require('config/settings.php') ?>
<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
		<title>Gander</title>
		<link rel="icon" type="image/png" href="favicon.png">
		<link type="text/css" href="css/ui-darkness/jquery-ui-1.8.16.custom.css" rel="stylesheet" />
		<link type="text/css" href="images/menus/icons.css" rel="stylesheet" />	
		<!-- jQuery -->
		<script type="text/javascript" src="js/jquery-1.7.1.min.js" alt="http://docs.jquery.com/Main_Page"></script>
		<!-- Bootstrap -->
		<script type="text/javascript" src="lib/bootstrap/bootstrap/js/bootstrap.min.js"></script>
		<link type="text/css" href="lib/bootstrap/bootstrap/css/bootstrap.min.css" rel="stylesheet" />	
		<? if (BOOTSTRAP_CSS) { ?>
		<link type="text/css" href="lib/bootswatch/<?=BOOTSTRAP_CSS?>/bootstrap.min.css" rel="stylesheet" />	
		<? } else { // Use default ?>
		<link type="text/css" href="lib/bootstrap/bootstrap/css/bootstrap-responsive.min.css" rel="stylesheet" />	
		<? } ?>
		<!-- Gander core -->
		<link type="text/css" href="css/core.css" rel="stylesheet" />	
		<link type="text/css" href="css/colors.dark.css" rel="stylesheet" />	
		<link type="text/css" href="css/layout.sidepanel.css" rel="stylesheet" />	
		<link type="text/css" href="css/jquery.jgrowl.css" rel="stylesheet" />	
		<link type="text/css" href="js/jquery.dynatree.skin/ui.dynatree.css" rel="stylesheet" />	
		<script type="text/javascript" src="js/jquery-ui-1.8.16.custom.min.js" alt="http://jqueryui.com/demos/"></script>
		<script type="text/javascript" src="lib/jquery-plugins/sortElements/jquery.sortElements.js" alt="https://github.com/padolsey/jQuery-Plugins"></script>
		<script type="text/javascript" src="js/jquery.dynatree.min.js" alt="http://wwwendt.de/tech/dynatree/doc/dynatree-doc.html"></script>
		<script type="text/javascript" src="js/jquery.jgrowl.min.js" alt="http://archive.plugins.jquery.com/project/jGrowl"></script>
		<script type="text/javascript" src="js/jquery.fullscreen.js" alt="http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/"></script>
		<script type="text/javascript" src="js/jquery.mousewheel.min.js" alt="http://adomas.org/javascript-mouse-wheel/"></script>

		<!-- Third party libraries -->
		<link type="text/css" href="lib/jquery-scrollpane/style/jquery.jscrollpane.css" rel="stylesheet" />
		<script type="text/javascript" src="lib/jquery-scrollpane/script/jquery.jscrollpane.min.js" alt="http://jscrollpane.kelvinluck.com"></script>
		<script type="text/javascript" src="lib/keymaster/keymaster.min.js" alt="https://github.com/madrobby/keymaster"></script>
		<link type="text/css" href="lib/jquery-contextmenu/src/jquery.contextMenu.css" rel="stylesheet" />
		<script type="text/javascript" src="lib/jquery-contextmenu/src/jquery.contextMenu.js" alt="https://github.com/medialize/jQuery-contextMenu"></script>
		<script type="text/javascript" src="lib/jquery-idletimer/jquery.idle-timer.js" alt="http://paulirish.com/2009/jquery-idletimer-plugin/"></script>

		<script type="text/javascript" src="js/core.js" alt="https://github.com/hash-bang/Gander"></script>
	</head>
	<body>
		<div id="window-menu" class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<ul class="nav">
					<li><a href="javascript:$.gander.cd('/')"><i class="icon-white icon-home"></i></a></li>
					<li class="divider"></li>
					<li><a href="#" id="menu-go">Go</a></li<>
					<li><a href="#" id="menu-select">Select</a></li>
					<li><a href="#" id="menu-zoom">Zoom</a></li>
					<li><a href="#" id="menu-sort">Sort</a></li>
					<li class="divider"></li>
					<li><ul id="window-breadcrumb" class="breadcrumb"></ul></li>
				</ul>
			</div>
		</div>
		<div id="window-set">
			<div id="window-dir">
				<div id="dirlist"></div>
			</div>
			<div id="window-list">
				<ul id="list"></ul>
			</div>
			<div id="window-display">
				<table width="100%" height="100%">
					<tr valign="center">
						<td align="center">
							<img id="display" src="images/gander.png"/>
							<div id="startup_error">
								<p><b>Honk, honk!</b></p>
								<p>It looks like something has gone horribly wrong!</p>
							</div>
						</td>
					</tr>
				</table>
				<div class="bumper" id="bumper-left"><div>&#9664;</div></div>
				<div class="bumper" id="bumper-right"><div>&#9654;</div></div>
			</div>
			<div id="window-throbber">
				<img src="images/throb.gif"/>
			</div>
		</div>
	</body>
</html>
