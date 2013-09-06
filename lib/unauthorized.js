module.exports = function(hostname, site, req, res, log) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="' + site.user + '"');
    res.write('401 - Unauthorized\r\n');
    return res.end();
}
