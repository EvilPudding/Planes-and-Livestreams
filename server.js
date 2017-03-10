var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var request = require('request');
var rbush = require('rbush');

var tree;

var last_requested = false;
function update_db()
{
	if(last_requested == false) return;
	
	request('https://opensky-network.org/api/states/all',
			function(error, res, body) {
		var new_tree = rbush(9, ['[5]', '[6]', '[5]', '[6]']); // accept [x, y] points 
		if(error || res.statusCode != 200) return;
		var states = JSON.parse(body)['states'];
		console.log(states.length);
		new_tree.load(states);
		console.log("insertion over");
		var old_tree = tree;
		if(old_tree) old_tree.clear();
		tree = new_tree;

		last_requested = false;
	});

}

setInterval(update_db, 5000);
update_db();
http.createServer(function (req, response) {

    var filePath = '.' + req.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }
	if(filePath.split('?')[0] == './planes')
	{
		response.writeHead(200, { 'Content-Type': 'application/json' });
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
		var resp = respond([query.minx, query.miny, query.maxx, query.maxy]);
		response.end(JSON.stringify(resp), 'utf-8');
		return;
	}
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(8000);


function respond(extent)
{
	if(last_requested == false) last_requested = true;
	if(!tree) return [];
	var result = tree.search({
		minX: extent[0],
		minY: extent[1],
		maxX: extent[2],
		maxY: extent[3]
	});
	return result;
}
