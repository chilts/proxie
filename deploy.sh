#!/bin/bash
## ----------------------------------------------------------------------------

set -e

## ----------------------------------------------------------------------------
# Set these to your preferred values.

source env.sh

echo "Checking all env vars have been set ..."
if [ -z "$PROXIMITY_USER" ]; then
    echo "Please set the PROXIMITY_USER env var"
    exit 2
fi
if [ -z "$PROXIMITY_GROUP" ]; then
    echo "Please set the PROXIMITY_GROUP env var"
    exit 2
fi
if [ -z "$PROXIMITY_NODE" ]; then
    echo "Please set the PROXIMITY_NODE env var"
    exit 2
fi
echo

## ----------------------------------------------------------------------------
# Firstly, make sure that proximity can listen on port 80.

# http://www.debian-administration.org/article/Running_network_services_as_a_non-root_user
echo "Setting up authbind to allow $PROXIMITY_USER:$PROXIMITY_GROUP to use port 80 ..."
sudo touch /etc/authbind/byport/80
sudo chown $PROXIMITY_USER:$PROXIMITY_GROUP /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80
echo

## ----------------------------------------------------------------------------

echo "Fetching new code ..."
git pull --rebase
echo

## ----------------------------------------------------------------------------

echo "Installing new npm packages ..."
npm install
echo

## ----------------------------------------------------------------------------

echo "Setting up various directories ..."
sudo mkdir -p /var/log/proximity/
sudo chown $PROXIMITY_USER:$PROXIMITY_GROUP /var/log/proximity/
echo

## ----------------------------------------------------------------------------

echo "Adding the logrotate.d config ..."
sudo cp etc/logrotate.d/proximity /etc/logrotate.d/
echo

## ----------------------------------------------------------------------------

# add the upstart scripts
echo "Copying upstart scripts ..."
m4 \
    -D __USER__=$PROXIMITY_USER \
    -D __NODE__=$PROXIMITY_NODE \
    -D __PROJ__=$PROXIMITY_PROJ \
    -D __DIRS__="$PROXIMITY_DIRS" \
    etc/init/proximity.conf.m4 | sudo tee /etc/init/proximity.conf
echo

## ----------------------------------------------------------------------------

# restart proximity
echo "Restarting services ..."
sudo service proximity restart
echo

## --------------------------------------------------------------------------------------------------------------------
