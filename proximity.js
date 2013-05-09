// ----------------------------------------------------------------------------
//
// proximity.js - simple configurable http proxy based on bouncy.
//
// Copyright 2013 Andrew Chilton.  All rights reserved.
//
// ----------------------------------------------------------------------------

var fs = require('fs');
var bouncy = require('bouncy');

// ----------------------------------------------------------------------------

function log(msg) {
    console.log((new Date()).toISOString() + ' : ' + msg);
}

function line() {
    log('-------------------------------------------------------------------------------');
}

function usage(msg) {
    console.log('Usage: %s %s <port> <dirs...>', process.argv[0], process.argv[1]);
    process.exit(2);
}

// ----------------------------------------------------------------------------

// firstly, read all the dirs
var port = process.argv[2];
var dirs = process.argv.slice(3);
var cfg = {};

// check that there is a port
if ( !port ) {
    usage();
    process.exit(0);
}

if ( dirs.length === 0 ) {
    usage();
    process.exit(0);
}

line();
log('Started');
log('Args:');
log(' - port=' + port);
log(' - dirs=' + JSON.stringify(dirs));

// ----------------------------------------------------------------------------

// look for a .proxy.js file in each dir
dirs.forEach(function(dir) {
    console.log(dir);

    // firstly, see if this directory has a .proxy
    var proxyfile = dir + '/.proxy';
    var exists = fs.existsSync(proxyfile);
    console.log(exists);

    if ( !exists ) {
        log('Directory ' + dir + ' contains no .proxy file, skipping');
        return;
    }

    log('Reading .proxy in directory ' + dir);

    var hosts = fs.readFileSync(dir + '/.proxy');
    hosts = JSON.parse(hosts);

    // for each host, read the config
    var hostNames = Object.keys(hosts);
    hostNames.forEach(function(hostName) {
        var host = hosts[hostName];
        cfg[hostName] = host;
    });
});

console.log(cfg);

var server = bouncy(function (req, res, bounce) {
    var host = (req.headers.host || '').replace(/:\d+$/, '');

    // if there is no host, then 404
    if ( !cfg[host] ) {
        log('Unknown host = ' + host);
        res.statusCode = 404;
        res.write('404 - Not Found\r\n');
        return res.end();
    }

    var site = cfg[host];
    log('Proxying ' + host + ' to ' + site.host + ':' + site.port);

    // firstly, see if this request should be a redirect
    if ( site.type === 'redirect' ) {
        log('Redirecting ' + req.headers.host + ' to ' + site.to);
        res.statusCode = 301;
        res.setHeader('Location', site.to + req.url);
        res.write('See ' + site.to + req.url + '\r\n');
        return res.end();
    }

    // bounce to this server
    bounce(site.host, site.port);
});

server.listen(port, function() {
    log('Proxy listening on port ' + port);
});

// ----------------------------------------------------------------------------
