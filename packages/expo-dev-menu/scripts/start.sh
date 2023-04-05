#!/usr/bin/env bash

PACKAGER_PORT=2137
PACKAGER_IP=`ifconfig | grep -v 127.0.0.1  | grep inet | grep -v inet6 | awk 'NR==1 {print $2}'`
PACKAGER_HOST="$PACKAGER_IP:$PACKAGER_PORT"
HOST_FILE='./assets/dev-menu-packager-host'

touch $HOST_FILE
echo $PACKAGER_HOST > $HOST_FILE

# Ignore any changes made to this file. The packager host should stay local
# but it cannot just be gitignored — it must be committed and published.
git update-index --skip-worktree $HOST_FILE

react-native start --port $PACKAGER_PORT
