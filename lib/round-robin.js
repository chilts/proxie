var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer();

module.exports = function(hostname, site, req, res, log) {
    if ( site.type === 'round-robin' ) {
        // choose the first host and then push it to the back
        var target = site.hosts.shift();
        log(hostname + ' ~= ' + target.host + ':' + target.port + req.url);
        proxy.web(
            req,
            res,
            { target : 'http://' + target.host + ':' + target.port },
            function(err) {
                log.error('Error with round-robin for ' + hostname + ' : ' + err);
                res.writeHead(502);
                res.end("There was an error proxying your request.");
            }
        );
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
