var g_map;
var planes = {};

var fov = 90;
var width  = 889;
var height = 500;
var camera_height = 10;

var scene, camera, renderer;
var geometry;
var sphere;
var sun;

var angx = Math.PI / 2;
// var angy = -Math.PI / 2;
var angy = Math.PI / 6;

var scale = 1000;
var earth_radius = 6378137;
var earth;

var elapsed = 0;
var last_time = new Date();
function animate() {
	current_time = new Date();
	elapsed += (current_time - last_time) / 10000;
	last_time = current_time;

    requestAnimationFrame( animate );
	var p = camera.position;

	// angx += 0.001;
	// update_camera();

	sphere.rotation.y = current_time / (24 * 60 * 60 * 1000);
	camera.up = new THREE.Vector3(0,0,1);
	camera.lookAt(new THREE.Vector3(p.x + Math.cos(angx) * Math.cos(angy),
		p.y + Math.sin(angx) * Math.cos(angy),
		p.z + Math.sin(angy)));

	var sun_dist = 1000000 / scale;
	var sun_pos = SunCalc.getSunPosition(current_time, camera.lat, camera.lon);
	sun_pos.azimuth += Math.PI;
	sun.position.x = sun_dist * Math.cos(sun_pos.azimuth) * Math.cos(sun_pos.altitude);
	sun.position.y = sun_dist * Math.sin(sun_pos.azimuth) * Math.cos(sun_pos.altitude);
	sun.position.z = sun_dist * Math.sin(sun_pos.altitude);

	for(var p in planes)
	{
		var pl = planes[p];

		pl.graph.position.x = pl.start_pos.x + pl.vel_x * elapsed;
		pl.graph.position.y = pl.start_pos.y + pl.vel_y * elapsed;
		pl.graph.position.z = pl.start_pos.z + pl.vel_z * elapsed;
	}

    renderer.render( scene, camera );
}

function init() {

    scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( fov, width / height, 0.001, 200000 );
	camera.position.x = 0;
	camera.position.y = 0;
	camera.position.z = camera_height / scale;
    // camera.rotation.y = - Math.PI / 2;


	var sun_geometry = new THREE.SphereGeometry( 50000 / scale, 12, 12);
	sun = new THREE.Mesh( sun_geometry,
		new THREE.MeshBasicMaterial( {
			color: 0xFFFF00
	}));

	var sphere_geometry = new THREE.SphereGeometry( earth_radius / scale * 10000, 18, 18);
	sphere = new THREE.Mesh( sphere_geometry,
		new THREE.MeshBasicMaterial( {
		color: 0x0000ff, wireframe: true
	}));

	// var loader = new THREE.TextureLoader();
	// loader.load( '/const.jpg', function ( texture ) {
	// 	scene.remove(sphere);

	// 	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5,
	// 		transparent: true
	// 	} );


	// 	sphere = new THREE.Mesh( sphere_geometry, material );
	// 	sphere.rotation.x += Math.PI / 2;

	// 	mesh.scale.set( - 1, 1, 1 );
	// 	scene.add( sphere );

	// } );
	sphere.rotation.x += Math.PI / 2;
	scene.add(sphere);

	// var earth_geometry = new THREE.SphereGeometry( earth_radius / scale, 16, 32);

	// earth = new THREE.Mesh( earth_geometry, new THREE.MeshPhongMaterial( {
	// 	color: 0x009900, polygonOffset: true,
	// 	polygonOffsetFactor: 10, polygonOffsetUnits: 1
	// } ) );
	// scene.add(earth);
	// var wireframe = new THREE.LineSegments( new THREE.EdgesGeometry(earth_geometry),
		// new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } ) );
	// earth.add(wireframe);

    // mesh = new THREE.Mesh(new THREE.CubeGeometry( 10 / scale, 10 / scale, 10 / scale),
    mesh = new THREE.Mesh(new THREE.PlaneGeometry( 10000 / scale, 10000 / scale, 1, 1),
		new THREE.MeshBasicMaterial( {
		color: 0x404040,
		transparent: true,
		opacity: 0.8
	} ));

    scene.add( mesh );
	mesh.add(sun);
	mesh.add(camera);

	renderer = new THREE.WebGLRenderer( {clearAlpha: 1, alpha: true } );

	renderer.setClearColor( 0x000000, 0);
    renderer.setSize(width, height);

    document.getElementById('overlay').appendChild( renderer.domElement );

    renderer.render( scene, camera );
}

var sauce = new ol.source.Vector({});
var stream_sauce = new ol.source.Vector({});
var swag =  new ol.style.Style({
	image: new ol.style.Circle({
		radius: 5,
		stroke: new ol.style.Stroke({
			color: 'rgba(0, 0, 0, 0.7)'
		}),
		fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0.2)'
		})
	})
});

function to_rad(degree)
{
	return degree * (Math.PI / 180);
}

function stream_geometry(feature)
{
	var f = to_rad(fov / 2);
	var size = g_map.getSize()[0] / 100000;
	var coordinates = [[[camera.lon, camera.lat],
		[camera.lon + size * Math.cos(angx - f), camera.lat + size * Math.sin(angx - f)],
		[camera.lon + size * Math.cos(angx + f), camera.lat + size * Math.sin(angx + f)]]];
	feature.getGeometry().setCoordinates(coordinates);
}

var stream_swag = new ol.style.Style({
	fill: new ol.style.Fill({
		fill: 'rgba(0, 0, 0, 0.6)'
	}),
	stroke: new ol.style.Stroke({
		color: 'rgba(0, 60, 136, 0.8)',
		width: 2
	})
})

var stream_feature = new ol.Feature({
	name: "Stream",
	style: stream_swag,
	geometry: new ol.geom.Polygon([[[0,0], [1,1], [1,0]]])
});

stream_sauce.addFeature(stream_feature);


var swag =  new ol.style.Style({
	image: new ol.style.Circle({
		radius: 5,
		stroke: new ol.style.Stroke({
			color: 'rgba(0, 0, 0, 0.7)'
		}),
		fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0.2)'
		})
	})
});

window.onload = function() {
	var bing_key = 'AlpGinC6G1tzT1ugvXjo5CBEDTMxlIarWk-vA31YuxZ2zOd1ltVXeNgvuk6Mkx52';

	var tile = [
		new ol.layer.Tile({
			source: new ol.source.BingMaps({ key: bing_key, imagerySet: 'AerialWithLabels' })
		}),
		new ol.layer.Vector({source: sauce}),
		new ol.layer.Vector({source: stream_sauce})
	];

	var center = [-82.728849, 36.157628];
	g_map = new ol.Map({
		layers: tile, target: 'map',
		controls: ol.control.defaults({ attribution: false,
			attributionOptions: ({ collapsible: false }) }),
		view: new ol.View({
			projection: 'EPSG:4326',
			center: center,
			zoom: 15.6
		})
	});

	g_map.on('click', function(evt){
		var c = evt.coordinate;
		angx = Math.PI + Math.atan2(camera.lat - c[1], camera.lon - c[0]);
		update_camera();

	});
	g_map.getView().on('propertychange', function(e) {
		switch(e.key)
		{
			case 'resolution':
				break;
			case 'center':
				var c = g_map.getView().getCenter();
				camera_set_pos(c[0], c[1], camera_height);
				// console.log();
				// req();
				break;
		}
	});

	init();
	animate();

	camera_set_pos(center[0], center[1], camera_height);

	setInterval(loop, 10000);
	var mouseX = 0;
	var mouseY = 0;
	var mouseDown = false;
	var drag_box = document.getElementById('drag_box');
	var embed = document.getElementById('embed');
	var button = document.getElementById('button');
	var controls = false;
	window.addEventListener('mousemove', function(event) {
		if(mouseDown)
		{
			angx += (mouseX - event.clientX) / 100;
			angy += (mouseY - event.clientY) / 100;
			mouseX = event.clientX;
			mouseY = event.clientY;
			update_camera();
		}
	}, true);
	button.addEventListener("click", function(event) {
		drag_box.className = (controls = !controls)?"fs":"";
		event.preventDefault();
		event.stopPropagation();
	}, false);
	drag_box.addEventListener("mousedown", function(event) {
		mouseDown = true;
		mouseX = event.clientX;
		mouseY = event.clientY;
		event.preventDefault();
	}, false);
	drag_box.addEventListener("mouseup", function(event) {
		mouseDown = false;
		event.preventDefault();
	}, false);
};

var lock = false;
function loop()
{
	req();
}

function abs_coords(lon, lat, alt)
{
	lon = lon / 180 * Math.PI;
	lat = lat / 180 * Math.PI;

	var R = (earth_radius + alt) / scale;

	var x = R * Math.cos(lat) * Math.cos(lon);

	var y = R * Math.cos(lat) * Math.sin(lon);

	var z = R * Math.sin(lat);

	return [x, y, z];
}

function camera_set_pos(lon, lat, alt)
{
	camera.lon = lon;
	camera.lat = lat;

	var coords = abs_coords(lon, lat, 0);
	var high = abs_coords(lon, lat, alt);
	// mesh.rotation.y += Math.PI / 2;
	// mesh.rotation.x += Math.PI / 2;

	mesh.position.x = coords[0];
	mesh.position.y = coords[1];
	mesh.position.z = coords[2];
	mesh.lookAt(new THREE.Vector3(high[0], high[1], high[2]));

	// earth.rotation.z = 0;
	// earth.rotation.y = 0;
	// earth.rotation.y = lon / 180 * Math.PI;
	// earth.rotation.z = lat / 180 * Math.PI;
	// earth.rotation.y += Math.PI / 2;

	update_camera();
}

function vert_change(new_ang)
{
	document.getElementById('angy').innerText = 'Vertical Angle: '+new_ang;
	angy = to_rad(new_ang);
	update_camera();
}

function fov_change(new_fov)
{
	document.getElementById('fov').innerText = 'FOV: '+new_fov;
	fov = new_fov;
	update_camera();
}

function update_camera()
{
	if(fov != camera.fov)
	{
		camera.fov = fov;
		camera.updateProjectionMatrix();
	}
	stream_geometry(stream_feature);
	stream_feature.changed();
}

function pos_from_coords(obj, lon, lat, alt)
{
	var coords = abs_coords(lon, lat, alt);

	obj.position.x = coords[0];
	obj.position.y = coords[1];
	obj.position.z = coords[2];
}

var n_lines = 4;
function req()
{
	if(lock) return;
	lock = true;
	var pos = g_map.getView().calculateExtent(g_map.getSize());
	var url = "/planes"
			+ "?minx=" + (pos[0] - 10)
			+ "&miny=" + (pos[1] - 10)
			+ "&maxx=" + (pos[2] + 10)
			+ "&maxy=" + (pos[3] + 10);
	$.ajax({
		url: url,
		dataType: 'json',
		success: function(data) {
			last_time = new Date();
			elapsed = 0;
			setTimeout(function(){lock = false}, 500);
			for(var i in data)
			{
				var pl = data[i];
				var id = pl[0]
				var cached = planes[id];
				if(cached)
				{
					cached.feature.getGeometry().translate(cached[5] - pl[5], cached[6] - pl[6]);

					pos_from_coords(cached.graph, pl[5], pl[6], pl[7]);
					var old_pos = cached.start_pos;
					cached.start_pos = cached.graph.position.clone();

					var geom = new THREE.Geometry();
					geom.vertices.push(old_pos, cached.start_pos);
					var line = new THREE.Line( geom, new THREE.LineBasicMaterial({
						color: 0xFF9900
					}) );
					scene.add(line);
					cached.lines.push(line);
					if(cached.lines.length > n_lines)
					{
						scene.remove(cached.lines.shift());
					}
					cached.vel_x = cached.start_pos.x - old_pos.x;
					cached.vel_y = cached.start_pos.y - old_pos.y;
					cached.vel_z = cached.start_pos.z - old_pos.z;

					cached[5] = pl[5];
					cached[6] = pl[6];
					cached[7] = pl[7];
				}
				else
				{


					planes[id] = pl;
					var feature = new ol.Feature({
						name: "Thing",
						style: swag,
						geometry: new ol.geom.Point([pl[5],pl[6]])
					});
					pl.feature = feature;
					sauce.addFeature(feature);

					{
						var dotGeometry = new THREE.Geometry();
						dotGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
						var dotMaterial = new THREE.PointsMaterial( {
							color: 0xff0000,
							size: 5, sizeAttenuation: false
						} );
						pl.graph = new THREE.Points( dotGeometry, dotMaterial );
						pos_from_coords(pl.graph, pl[5], pl[6], pl[7]);
						pl.start_pos = pl.graph.position.clone();

						pl.vel_x = 0;
						pl.vel_y = 0;
						pl.vel_z = 0;

						scene.add( pl.graph );
						pl.lines = [];
					}
				}
			}
		},
		error: function(data) {
			lock = false;
			console.log("ERROR");
		}
	});
}
