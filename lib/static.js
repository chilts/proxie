// core
var url = require('url');

// npm
var send = require('send');

module.exports = function(hostname, site, req, res, log) {
    // if this is a static site, serve using ...
    if ( site.type === 'static' ) {
        var path = url.parse(req.url).pathname;
        log(hostname + ' :: ' + site.dir + path);

        send(req, path)
            .root(site.dir)
            .on('error', function(err) {
                res.statusCode = err.status || 500;
                res.end(err.code === 'ENOENT' ? '404 - Not Found\r\n' : err.message);
            })
            .on('file', function(path, stat) {
                log('wanting a file ' + path);
            })
            .on('directory', function() {
                res.statusCode = 301;
                res.setHeader('Location', req.url + '/');
                res.end('Redirecting to ' + req.url + '/');
            })
            .pipe(res)
        ;
        return;
    }
};
