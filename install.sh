#!/bin/bash
## ----------------------------------------------------------------------------

set -e

## ----------------------------------------------------------------------------
# Set these to your preferred values.

PROXIE_USER=`id -un`
PROXIE_GROUP=`id -gn`
PROXIE_PWD=`pwd`
PROXIE_NODE=`which node`

## ----------------------------------------------------------------------------

echo "Installing new npm packages ..."
npm install --production
echo

## ----------------------------------------------------------------------------

echo "Setting up various directories ..."
sudo mkdir -p /var/log/proxie/
sudo chown $PROXIE_USER:$PROXIE_GROUP /var/log/proxie/
echo

## ----------------------------------------------------------------------------

echo "Adding the logrotate.d config ..."
sudo cp etc/logrotate.d/proxie /etc/logrotate.d/
echo

## ----------------------------------------------------------------------------

echo "Copying the /etc/proxie.ini file ..."
sudo cp etc/proxie.ini /etc/
echo

## ----------------------------------------------------------------------------

echo "Making the /etc/proxie.d/ directory ..."
sudo mkdir -p /etc/proxie.d/
echo

## ----------------------------------------------------------------------------
# make sure that proxie can listen on port 80.

# http://www.debian-administration.org/article/Running_network_services_as_a_non-root_user
echo "Setting up authbind to allow $PROXIE_USER:$PROXIE_GROUP to use port 80 ..."
sudo touch /etc/authbind/byport/80
sudo chown $PROXIE_USER:$PROXIE_GROUP /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80
echo

## ----------------------------------------------------------------------------

# add the upstart scripts
echo "Copying upstart scripts ..."
m4 \
    -D __USER__=$PROXIE_USER \
    -D __NODE__=$PROXIE_NODE \
    -D  __PWD__=$PROXIE_PWD   \
    -D __NODE__=$PROXIE_NODE \
    etc/init/proxie.conf.m4 | sudo tee /etc/init/proxie.conf
echo

## ----------------------------------------------------------------------------

# restart proxie
echo "Restarting services ..."
sudo service proxie restart
echo

## --------------------------------------------------------------------------------------------------------------------
