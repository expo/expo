#!/usr/bin/env bash

function join_by { local d=$1; shift; echo -n "$1"; shift; printf "%s" "${@/$d}"; }

command="instruments"

function setTraceTemplate {
  # Finds the default Automation trace template file.
  traceTemplate=$(find /Developer/Platforms/iPhoneOS.platform/Developer/Library/Instruments -type f -name "Automation.tracetemplate")
  if [[ -z "${traceTemplate}" ]]
  then
    echo "Error: Could not find Automation.tracetemplate" >&2
    exit 1
  else
    command="${command} -t \"${traceTemplate}\""
  fi
}


APP=$1
PLATFORM=$2
MODULES=$(join_by , "${@:3}") 
LINK="bareexpo://${APP}/run?tests=${MODULES}"

echo " ☛  Opening ${MODULES} in ${APP}..."
if [ $PLATFORM = "android" ]; then
    echo $(adb shell am start -W -a android.intent.action.VIEW -d "$LINK" dev.expo.payments)
elif [ $PLATFORM = "ios" ]; then
    # CONNECTED_DEVICE=$(node ios-deploy -c | grep -oE 'Found ([0-9A-Za-z\-]+)' | sed 's/Found //g')
    # if [ -z "${CONNECTED_DEVICE}" ]; then
        $(xcrun simctl openurl booted $LINK)
    # else
    #     $(xcrun simctl openurl $CONNECTED_DEVICE $LINK)
    # fi
else
    $(xcrun simctl openurl booted $LINK)
    echo $(adb shell am start -W -a android.intent.action.VIEW -d "$LINK" dev.expo.payments)
fi