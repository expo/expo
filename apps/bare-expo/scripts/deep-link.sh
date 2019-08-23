#!/bin/bash

function join_by { local d=$1; shift; echo -n "$1"; shift; printf "%s" "${@/#/$d}"; }

APP=$1
PLATFORM=$2
MODULES=$(join_by , "${@:3}") 
LINK="bareexpo://${APP}/select/${MODULES}"

echo " ☛  Opening ${MODULES} in ${APP}..."
if [ $PLATFORM = "android" ]; then
    echo $(adb shell am start -W -a android.intent.action.VIEW -d "$LINK" dev.expo.payments)
else
    $(xcrun simctl openurl booted $LINK)
fi