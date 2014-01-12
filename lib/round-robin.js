var httpProxy = require('http-proxy');

var proxy = new httpProxy.RoutingProxy();

module.exports = function(hostname, site, req, res, log) {
    if ( site.type === 'round-robin' ) {
        // choose the first host and then push it to the back
        var target = site.hosts.shift();
        log(hostname + ' ~= ' + target.host + ':' + target.port + req.url);
        proxy.proxyRequest(req, res, target);
        site.hosts.push(target);
        return;
    }
}

module.exports.preprocess = function(site) {
    // only pre-process if the type is 'round-robin'
    if ( site.type !== 'round-robin' ) {
        return;
    }

    console.log(site);

    // pre-process the site.hosts
    if ( typeof site.hosts === 'string' ) {
        site.hosts = site.hosts.split(',');
    }

    site.hosts.forEach(function(host, i) {
        if ( host.match(/:/) ) {
            var hostAndPort = host.split(/:/);
            site.hosts[i] = {
                host :  hostAndPort[0],
                port : +hostAndPort[1],
            };
        }
        else {
            site.hosts[i] = {
                host : host,
                port : 80,
            };
        }
    });
    console.log(site);
    return site;
};
