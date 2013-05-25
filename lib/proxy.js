var httpProxy = require('http-proxy');

var proxy = new httpProxy.RoutingProxy();

module.exports = function(hostname, site, req, res, log) {
    // bounce to this server
    if ( site.type === 'proxy' ) {
        log(hostname + ' == ' + site.host + ':' + site.port + req.url);
        proxy.proxyRequest(req, res, { host : site.host, port : site.port });
        return;
    }
};
