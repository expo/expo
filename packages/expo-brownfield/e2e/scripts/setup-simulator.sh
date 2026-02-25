#!/usr/bin/env bash

function wait_for_simulator_ready() {
  local DEVICE_ID=$1
  local timeout=${2:-60}
  
  echo " ⏳ Waiting for simulator to be ready for app installation..."
  
  local attempts=0
  while [[ $attempts -lt $timeout ]]; do
    local is_booted=$(xcrun simctl list devices booted --json 2>/dev/null | jq -e --arg udid "$DEVICE_ID" '.devices | to_entries[] | .value[] | select(.udid == $udid)' > /dev/null 2>&1 && echo "yes" || echo "no")
    local device_state=$(xcrun simctl list devices "$DEVICE_ID" --json 2>/dev/null | jq -r --arg udid "$DEVICE_ID" '.devices | to_entries[] | .value[] | select(.udid == $udid) | .state' 2>/dev/null || echo "unknown")
    
    if [[ "$is_booted" == "yes" && "$device_state" == "Booted" ]]; then
      echo " ✅ Simulator is ready for app installation (state: $device_state)"
      return 0
    fi
    
    sleep 1
    attempts=$((attempts + 1))
  done
  
  echo " ⚠️  Simulator might not be fully ready (booted: $is_booted, state: $device_state)"
  return 1
}

function start_simulator() {
  local DEVICE="iPhone 17 Pro"
  local DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  local IOS_VERSION="26"
  local RETRIES=3
  local CI=${CI:-true}

  echo " 🔍 Looking for device: $DEVICE with iOS version: $IOS_VERSION..."

  DEVICE_ID=$(xcrun simctl list devices iPhone available --json | jq -r --arg device "$DEVICE" --arg ios_version "$IOS_VERSION" '.devices | to_entries[] | select(.key | contains("com.apple.CoreSimulator.SimRuntime.iOS-" + $ios_version + "-2")) | .value[] | select(.name == $device) | .udid' | head -n1)
  if [[ -z "$DEVICE_ID" ]]; then
      echo " ⚠️  No device found for $DEVICE with iOS $IOS_VERSION"
      return 1
  fi

  export DEVICE_ID

  local RETRY_COUNT=0
  while [[ $RETRY_COUNT -lt $RETRIES ]]; do
      xcrun simctl shutdown "$DEVICE_ID" || true
      xcrun simctl erase "$DEVICE_ID" || true
    
      echo " 📱 Starting Device - name[$DEVICE] udid[$DEVICE_ID] (attempt $((RETRY_COUNT + 1))/$RETRIES)"

      if xcrun simctl boot "$DEVICE_ID" 2>/dev/null; then
          echo " ⏳ Waiting for device to boot..."
          xcrun simctl bootstatus "$DEVICE_ID" -b > /dev/null 2>&1 &
          local bootstatus_pid=$!
          local boot_timeout=180
          
          while [[ $boot_timeout -gt 0 ]]; do
            if ! kill -0 $bootstatus_pid 2>/dev/null; then
              break
            fi
            sleep 1
            boot_timeout=$((boot_timeout - 1))
          done
          
          kill $bootstatus_pid 2>/dev/null || true
          wait $bootstatus_pid 2>/dev/null || true

          if [[ $boot_timeout -eq 0 ]]; then
            echo " ⚠️  Boot timeout reached, checking device state..."
          fi
          
          if wait_for_simulator_ready "$DEVICE_ID" 30; then
              echo " ✅ Device started and ready"

              if [[ "$CI" == "false" ]]; then
                  open -a Simulator --args -CurrentDeviceUDID "$DEVICE_ID"
              fi

              return 0
          else
              echo " ⚠️  Device booted but not fully ready"
          fi
      fi
      
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [[ $RETRY_COUNT -lt $RETRIES ]]; then
          echo " ⚠️  Device failed to start, retrying... (retry $RETRY_COUNT of $RETRIES)"
          sleep 5
      fi
  done

  echo " ❌ Failed to start device after $RETRIES attempts"
  return 1
}
