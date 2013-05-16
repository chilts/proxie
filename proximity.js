// ----------------------------------------------------------------------------
//
// proximity.js - simple configurable http proxy based on bouncy.
//
// Copyright 2013 Andrew Chilton.  All rights reserved.
//
// ----------------------------------------------------------------------------

var fs = require('fs');
var url = require('url');
var http = require('http');

var httpProxy = require('http-proxy');
var iniparser = require('iniparser');
var log2 = require('log2');
var send = require('send');

// ----------------------------------------------------------------------------
// configuration

process.title = 'proximity';

var cfgFile = '/etc/proximity.ini';
var cfgDir  = '/etc/proximity.d';
var cfg     = iniparser.parseSync(cfgFile);
var port    = cfg.port;
var logfile = cfg.logfile;
var log;
if ( logfile === 'stdout' ) {
    log = log2({ stream : process.stdout });
}
else {
    log = log2({ stream : fs.createWriteStream(logfile) }); // ToDo: make this append
}

line();
log('Started');

var sites = {};

// ----------------------------------------------------------------------------

function log(msg) {
    log((new Date()).toISOString() + ' : ' + msg);
}

function line() {
    log('-------------------------------------------------------------------------------');
}

function usage(msg) {
    console.warn('Usage: %s %s <port> <proxyfiles...>', process.argv[0], process.argv[1]);
    process.exit(2);
}

// ----------------------------------------------------------------------------

// find all the files in /etc/proximity.d/
var files = fs.readdirSync(cfgDir);

// look for a .proxy file in each dir
files.forEach(function(proxyfile) {
    log('Reading ' + cfgDir + '/' + proxyfile);

    // read the sites from the proxyfile
    var localSites = iniparser.parseSync(cfgDir + '/' + proxyfile);

    // store each site into the global sites list
    var siteNames = Object.keys(localSites);
    siteNames.forEach(function(siteName) {
        if ( sites[siteName] ) {
            var msg = 'File ' + proxyfile + ' defines a duplicate site : ' + siteName;
            process.warn(msg);
            log(msg);
            process.exit(2);
        }

        // now store it
        sites[siteName] = localSites[siteName];
    });
});

log('Sites : ' + JSON.stringify(sites));

var proxy = new httpProxy.RoutingProxy();

var server = http.createServer(function (req, res) {
    var host = (req.headers.host || '').replace(/:\d+$/, '');

    // if there is no host, then 404
    if ( !sites[host] ) {
        log('Unknown host = ' + host);
        res.statusCode = 404;
        res.write('404 - Not Found\r\n');
        return res.end();
    }

    // get hold of this site
    var site = sites[host];

    // The type of site will be one of the following:
    // * redirect
    // * static
    // * proxy

    // see if this request should be a redirect
    if ( site.type === 'redirect' ) {
        log(req.headers.host + ' -> ' + site.to + req.url);
        res.statusCode = 301;
        res.setHeader('Location', site.to + req.url);
        res.write('See ' + site.to + req.url + '\r\n');
        return res.end();
    }

    // if this is a static site, serve using ...
    if ( site.type === 'static' ) {
        var path = url.parse(req.url).pathname;
        log(req.headers.host + ' :: ' + site.dir + path);

        send(req, path)
            .root(site.dir)
            .on('error', function(err) {
                res.statusCode = err.status || 500;
                res.end(err.code === 'ENOENT' ? '404 - Not Found\r\n' : err.message);
            })
            .on('file', function(path, stat) {
                log('wanting a file');
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

    // bounce to this server
    if ( site.type === 'proxy' ) {
        log(host + ' == ' + site.host + ':' + site.port + req.url);
        proxy.proxyRequest(req, res, { host : site.host, port : site.port });
        return;
    }

    // we don't know what type of site this is, so just serve a 404
    log('Unknown site type = ' + site.type);
    res.statusCode = 404;
    res.write('404 - Not Found\r\n');
    return res.end();
});

server.listen(port, function() {
    log('Proxy listening on port ' + port);
});

// ----------------------------------------------------------------------------
