#!/usr/bin/env bash

set +e

bootanim=""
connectionAttempts=0
until [[ "$bootanim" =~ "stopped" ]]; do
   bootanim=`${ANDROID_SDK_ROOT:-$ANDROID_HOME}/platform-tools/adb -e shell getprop init.svc.bootanim 2>&1`
   echo " ☛  $bootanim"
   if [[ "$bootanim" =~ "not found" ]]; then
      let "connectionAttempts += 1"
      if [[ $connectionAttempts -gt 15 ]]; then
        echo " 🛑  Failed to start emulator"
        exit 1
      fi
   fi
   sleep 1
done

echo " ✅  Emulator is ready"
