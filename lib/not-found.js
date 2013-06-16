module.exports = function(hostname, site, req, res, log) {
    // we don't know what type of site this is, so just serve a 404
    if ( Object.prototype.toString.call(site) === '[object Object]' ) {
        log('Unknown site.type = ' + site.type);
    }
    else {
        // if this site is not known about just log the hostname
        log('Not Found = ' + hostname);
    }
    res.statusCode = 404;
    res.write('404 - Not Found\r\n');
    return res.end();
}
