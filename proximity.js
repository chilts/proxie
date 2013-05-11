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
    console.log('Usage: %s %s <port> <proxyfiles...>', process.argv[0], process.argv[1]);
    process.exit(2);
}

// ----------------------------------------------------------------------------

// firstly, read all the files
var port = process.argv[2];
var files = process.argv.slice(3);
var cfg = {};

// check that there is a port
if ( !port ) {
    usage();
    process.exit(0);
}

if ( files.length === 0 ) {
    usage();
    process.exit(0);
}

line();
log('Started');
log('Args:');
log(' - port=' + port);
log(' - files=' + JSON.stringify(files));

// ----------------------------------------------------------------------------

// look for a .proxy file in each dir
files.forEach(function(proxyfile) {
    // see if the .proxy file exists
    var exists = fs.existsSync(proxyfile);
    if ( !exists ) {
        log('Skipping ' + dir + '/ (no .proxy file)');
        return;
    }

    log('Reading ' + proxyfile);

    var hosts = fs.readFileSync(proxyfile);
    hosts = JSON.parse(hosts);

    // for each host, read the config
    var hostNames = Object.keys(hosts);
    hostNames.forEach(function(hostName) {
        var host = hosts[hostName];
        cfg[hostName] = host;
    });
});

log('Config : ' + JSON.stringify(cfg));

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
    log(host + ' -> ' + site.host + ':' + site.port + req.url);

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
