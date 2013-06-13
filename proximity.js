// ----------------------------------------------------------------------------
//
// proximity.js - a pluggable and configurable HTTP proxy/server.
//
// Copyright 2013 Andrew Chilton.  All rights reserved.
//
// ----------------------------------------------------------------------------

var fs = require('fs');
var url = require('url');
var http = require('http');

var iniparser = require('iniparser');
var log2 = require('log2');
var send = require('send');

// ----------------------------------------------------------------------------
// configuration

process.title = 'proximity';

var cfgFile = '/etc/proximity.ini';
var cfgDir  = '/etc/proximity.d';
var cfg     = iniparser.parseSync(cfgFile);
var port    = process.argv[2] || cfg.port;
var logfile = cfg.logfile;
var stream  = logfile === 'stdout' ? process.stdout : fs.createWriteStream(logfile);
var log     = log2({ stream : stream });

line();
log('Started');

// ----------------------------------------------------------------------------
// strategies and sites

var strategy = {};
var strategies = [
    'load-balancer-round-robin',
    'not-found',
    'proxy',
    'redirect',
    'static',
];

strategies.forEach(function(name) {
    strategy[name] = require('./lib/' + name + '.js');
});

// sites
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

Object.keys(sites).forEach(function(siteName) {
    log('Site : ' + siteName + ' -> ' + JSON.stringify(sites[siteName]));
});

var server = http.createServer(function (req, res) {
    var hostname = (req.headers.host || '').replace(/:\d+$/, '');

    // if there is no host, then 404
    if ( !sites[hostname] ) {
        return strategy['not-found'](hostname, undefined, req, res, log);
    }

    // get hold of this site
    var site = sites[hostname];

    // if there is a strategy for this site.type, send it there
    if ( strategy[site.type] ){
        return strategy[site.type](hostname, site, req, res, log);
    }

    // else, we don't know what type this site is, so we'll use the Not Found strategy
    strategy['not-found'](hostname, site, req, res, log);
});

server.listen(port, function() {
    log('Proxy listening on port ' + port);
});

// ----------------------------------------------------------------------------
