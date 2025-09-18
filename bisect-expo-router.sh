#!/bin/bash

echo "!!! Starting bisect test !!!"
echo "Commit: $(git rev-parse HEAD)"

yarn
cd packages/expo-router
yarn clean
CI=1 yarn build

if timeout --kill-after=5s 30s bash -c "CI=1 yarn test hooks"; then
    echo "!!! Tests passed - marking as good !!!"
    exit 0
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ] || [ $EXIT_CODE -eq 137 ]; then
        echo "!!! Tests timed out - marking as bad !!!"
        exit 1
    else
        echo "!!! Tests failed with exit code $EXIT_CODE - marking as bad !!!"
        exit 1
    fi
fi