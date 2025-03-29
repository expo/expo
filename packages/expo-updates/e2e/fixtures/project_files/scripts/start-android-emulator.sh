#/bin/bash

emulator @pixel_4 -no-audio -no-boot-anim > /dev/null 2>&1  &

max_retry=30
counter=0
until adb shell getprop sys.boot_completed; do
  sleep 2
  echo "Attempt $counter of $max_retry..."
  if [[ $counter -eq $max_retry ]]; then
    echo "Failed to start the emulator!"
    exit 1
  fi
  counter=$((counter + 1))
done

echo "Emulator started."

adb reverse tcp:4747 tcp:4747
