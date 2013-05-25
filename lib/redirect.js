module.exports = function(hostname, site, req, res, log) {
    // see if this request should be a redirect
    if ( site.type === 'redirect' ) {
        log(hostname + ' -> ' + site.to + req.url);
        res.statusCode = 301;
        res.setHeader('Location', site.to + req.url);
        res.write('See ' + site.to + req.url + '\r\n');
        return res.end();
    }
};
