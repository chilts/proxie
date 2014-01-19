var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer();

module.exports = function(hostname, site, req, res, log) {
    // bounce to this server
    if ( site.type === 'proxy' ) {
        log(hostname + ' == ' + site.host + ':' + site.port + req.url);
        proxy.web(
            req,
            res,
            { target : 'http://' + site.host + ':' + site.port },
            function(err) {
                log.error('Error with proxy for ' + hostname + ' : ' + err);
                res.writeHead(502);
                res.end("There was an error proxying your request.");
            }
        );
        return;
    }
};
