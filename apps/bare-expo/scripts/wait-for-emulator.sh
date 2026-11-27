#!/usr/bin/env bash

set +e

booted=""
connectionAttempts=0
until [[ "$booted" =~ ^1 ]]; do
   booted=`${ANDROID_SDK_ROOT:-$ANDROID_HOME}/platform-tools/adb -e shell getprop sys.boot_completed 2>&1`
   echo " ☛  $booted"
   if [[ "$booted" =~ "not found" ]]; then
      let "connectionAttempts += 1"
      if [[ $connectionAttempts -gt 15 ]]; then
        echo " 🛑  Failed to start emulator"
        exit 1
      fi
   fi
   sleep 1
done

echo " ✅  Emulator is ready"
