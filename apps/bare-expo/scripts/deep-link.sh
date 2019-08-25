#!/bin/bash

function join_by { local d=$1; shift; echo -n "$1"; shift; printf "%s" "${@/#/$d}"; }

APP=$1
PLATFORM=$2
if [ -z "${3}" ]; then
    MODULES=$(join_by , "${@:2}") 
else
    MODULES=$(join_by , "${@:3}") 
fi
LINK="bareexpo://${APP}/select/${MODULES}"

echo " ☛  Opening ${MODULES} in ${APP}..."
if [ $PLATFORM = "android" ]; then
    echo $(adb shell am start -W -a android.intent.action.VIEW -d "$LINK" dev.expo.payments)
elif [ $PLATFORM = "ios" ]; then
    $(xcrun simctl openurl booted $LINK)
else
    $(xcrun simctl openurl booted $LINK)
    echo $(adb shell am start -W -a android.intent.action.VIEW -d "$LINK" dev.expo.payments)
fi