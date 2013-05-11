# Proximity #

A simple configurable http proxy based on bouncy.

## Config File ##

Proximity reads the config file ```/etc/proximity.ini``` to get some settings. Currently the only setting read is
```port```. An example config file is:

```
port=80
```

## /etc/proximity.d/ ##

So that Proximity knows which sites to proxy, you should put files into the ```/etc/proximity.d/``` directory. An
example config file for a simple site might be:

e.g. ```/etc/proximity.d/chilts-org```:

```
[www.chilts.org]
type=redirect
to=chilts.org

[chilts.org]
type=proxy
host=localhost
port=3000
```

As you can see, all requests on the ```www.chilts.org``` subdomain will be redirected to the naked domain.

All requests on the naked domain will be proxied through to ```localhost:3000```.

It is up to your blog site to install a relevant file into ```/etc/proximity.d/``` so that proximity knows where to
proxy the site.

An example config you might use when locally developing a site could be:

```
[chilts.localhost]
type=proxy
host=localhost
port=3000
```

# Author #

Written by [Andrew Chilton](http://chilts.org/) - [Blog](http://chilts.org/blog/) -
[Twitter](https://twitter.com/andychilton).

# License #

* [Copyright 2013 Andrew Chilton.  All rights reserved.](http://chilts.mit-license.org/2013/)

(Ends)
