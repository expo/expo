#!/bin/bash

# Records the emulator screen while a Maestro suite runs, so a CI failure that does not reproduce
# locally can be watched afterwards. Adapted from the screen recording steps of the EAS Maestro
# test job (universe: WorkflowMaestroTestJob.ts).
#
# Usage: android-screen-recording.sh start
#        android-screen-recording.sh stop <name>
#
# `stop` writes $HOME/screen-recordings/<name>.mp4. Neither command fails the job when recording
# does not work: a missing video must not turn a passing test run red.

set -euo pipefail

REMOTE_RECORDING_PATH=/sdcard/expo-recording.mp4
REMOTE_PID_PATH=/sdcard/.expo-recording.pid
REMOTE_LOG_PATH=/sdcard/.expo-recording.log
LOCAL_RECORDING_DIRECTORY="$HOME/screen-recordings"

# Some encoders cannot handle a native high-density display size, and fail immediately with
# "Unable to get output buffers (err=-38)". Cap the longer edge and keep the aspect ratio.
MAX_EDGE=1280

# Prints the `--size` argument for screenrecord, or nothing to keep its default size.
function sizeArgument() {
  local displaySize width height outWidth outHeight

  # `wm size` prints "Physical size: 1080x2280", and also "Override size: ..." when one is set.
  # Take the last one, which is the size the display is actually running at.
  displaySize=$(adb shell wm size | tr -d '\r' | grep -Eo '[0-9]+x[0-9]+' | tail -n 1 || true)
  if ! printf '%s' "$displaySize" | grep -Eq '^[0-9]+x[0-9]+$'; then
    return 0
  fi

  width=${displaySize%x*}
  height=${displaySize#*x}
  outWidth=$width
  outHeight=$height
  if [[ $width -ge $height && $width -gt $MAX_EDGE ]]; then
    outWidth=$MAX_EDGE
    outHeight=$((height * outWidth / width))
  elif [[ $height -gt $MAX_EDGE ]]; then
    outHeight=$MAX_EDGE
    outWidth=$((width * outHeight / height))
  fi

  # H.264 encoders handle macroblock-aligned sizes more reliably than arbitrary ones.
  outWidth=$((outWidth - outWidth % 16))
  outHeight=$((outHeight - outHeight % 16))
  if [[ $outWidth -ge 16 && $outHeight -ge 16 ]]; then
    echo "--size ${outWidth}x${outHeight}"
  fi
}

function start() {
  local i=0
  while [[ $i -lt 10 ]] && ! adb shell touch /sdcard/.expo-recording-ready >/dev/null 2>&1; do
    sleep 1
    i=$((i + 1))
  done
  if [[ $i -ge 10 ]]; then
    echo "Device filesystem is not writable; continuing without a screen recording"
    return 0
  fi

  adb shell "rm -f $REMOTE_RECORDING_PATH $REMOTE_PID_PATH $REMOTE_LOG_PATH" || true

  local sizeArgument timeLimitArgument
  sizeArgument=$(sizeArgument)

  # Android 11 and later record without a limit when it is set to 0. Older versions stop at their
  # three minute maximum, which is still better than no recording.
  timeLimitArgument=""
  if adb shell screenrecord --help 2>&1 | grep -q "remove the time limit"; then
    timeLimitArgument="--time-limit 0"
  fi

  adb shell "nohup screenrecord --verbose $sizeArgument $timeLimitArgument $REMOTE_RECORDING_PATH >$REMOTE_LOG_PATH 2>&1 </dev/null & echo \$! >$REMOTE_PID_PATH"

  if adb shell "test -s $REMOTE_PID_PATH"; then
    echo "Started screen recording ${sizeArgument:-at the default size}"
  else
    echo "Could not start screen recording; continuing without one"
  fi
}

function stop() {
  local name=$1
  local pid i=0

  pid=$(adb shell "cat $REMOTE_PID_PATH 2>/dev/null || true" | tr -d '\r')
  if [[ -z $pid ]]; then
    echo "No screen recording is running; nothing to save for $name"
    return 0
  fi

  # SIGINT lets screenrecord finish writing the file. A harder signal truncates the mp4.
  adb shell "kill -2 $pid" >/dev/null 2>&1 || true
  while [[ $i -lt 10 ]] && adb shell "kill -0 $pid" >/dev/null 2>&1; do
    sleep 1
    i=$((i + 1))
  done
  if [[ $i -ge 10 ]]; then
    echo "screenrecord did not exit; skipping $name.mp4"
    return 0
  fi

  mkdir -p "$LOCAL_RECORDING_DIRECTORY"
  if adb pull "$REMOTE_RECORDING_PATH" "$LOCAL_RECORDING_DIRECTORY/$name.mp4" >/dev/null 2>&1; then
    echo "Wrote $LOCAL_RECORDING_DIRECTORY/$name.mp4"
  else
    echo "Could not pull the recording for $name"
  fi

  adb shell "rm -f $REMOTE_RECORDING_PATH $REMOTE_PID_PATH $REMOTE_LOG_PATH" || true
}

case "${1:-}" in
  start)
    start
    ;;
  stop)
    if [[ $# -ne 2 ]]; then
      echo "Usage: $0 stop <name>" >&2
      exit 1
    fi
    stop "$2"
    ;;
  *)
    echo "Usage: $0 start | $0 stop <name>" >&2
    exit 1
    ;;
esac
