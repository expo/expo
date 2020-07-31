#!/usr/bin/env bash

PACKAGER_PORT=2137
PACKAGER_IP=`ifconfig en0 | grep inet | grep -v inet6 | awk '{print $2}'`
PACKAGER_HOST="$PACKAGER_IP:$PACKAGER_PORT"
HOST_FILE='./assets/.dev-menu-packager-host'

touch $HOST_FILE
echo $PACKAGER_HOST > $HOST_FILE

react-native start --port $PACKAGER_PORT
