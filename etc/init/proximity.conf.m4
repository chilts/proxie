## ----------------------------------------------------------------------------
#
# Upstart script for proximity.
#
## ----------------------------------------------------------------------------

# info
description "proximity - simple configurable http proxy based on bouncy."
author      "Andrew Chilton"

# respawn this task
start on runlevel [2345]
respawn
respawn limit 20 5
stop on shutdown

# allow opening of more than 1024 files
limit nofile 4096 4096

# set some environment variables
env NODE_ENV=production

# the script itself
script

    # quit the script if something goes wrong
    set -e

    # run the webserver as ubuntu
    exec \
        sudo -E -u __USER__ \
        authbind \
        __NODE__ \
        __PROJ__/proximity.js 2>&1 >> /var/log/proximity/proxy.log

end script

## ----------------------------------------------------------------------------
