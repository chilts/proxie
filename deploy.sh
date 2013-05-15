#!/bin/bash
## ----------------------------------------------------------------------------

set -e

## ----------------------------------------------------------------------------
# Set these to your preferred values.

PROXIMITY_USER=`id -un`
PROXIMITY_GROUP=`id -gn`
PROXIMITY_PWD=`pwd`
PROXIMITY_NODE=`which node`

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

echo "Copying the /etc/proximity.ini file ..."
sudo cp etc/proximity.ini /etc/
echo

## ----------------------------------------------------------------------------

echo "Making the /etc/proximity.d/ directory ..."
sudo mkdir -p /etc/proximity.d/
echo

## ----------------------------------------------------------------------------
# make sure that proximity can listen on port 80.

# http://www.debian-administration.org/article/Running_network_services_as_a_non-root_user
echo "Setting up authbind to allow $PROXIMITY_USER:$PROXIMITY_GROUP to use port 80 ..."
sudo touch /etc/authbind/byport/80
sudo chown $PROXIMITY_USER:$PROXIMITY_GROUP /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80
echo

## ----------------------------------------------------------------------------

# add the upstart scripts
echo "Copying upstart scripts ..."
m4 \
    -D __USER__=$PROXIMITY_USER \
    -D __NODE__=$PROXIMITY_NODE \
    -D  __PWD__=$PROXIMITY_PWD   \
    -D __NODE__=$PROXIMITY_NODE \
    etc/init/proximity.conf.m4 | sudo tee /etc/init/proximity.conf
echo

## ----------------------------------------------------------------------------

# restart proximity
echo "Restarting services ..."
sudo service proximity restart
echo

## --------------------------------------------------------------------------------------------------------------------
