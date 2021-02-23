#!/usr/bin/env bash

## Some crazy stuff to set your network proxy
PROXY_URL="http://localhost:2000/proxy.pac"

INTERFACE=$(route -n get default | grep interface | sed "s/.*interface: \\(.*\\)/\\1/")
NETWORK=$(networksetup -listnetworkserviceorder | grep -B1 "$INTERFACE" | head -n 1 | sed "s/([0-9]*) \\(.*\\)/\\1/")

CURRENT_PROXY_URL=$(networksetup -getautoproxyurl "$NETWORK" | grep "^URL:" | sed "s/URL: //")

if [[ "$CURRENT_PROXY_URL" != "$PROXY_URL" ]]; then
  # shellcheck disable=SC1117
  osascript -e "tell application (path to frontmost application as text) to display dialog \"Hi there! You are launching the test fixture server so we need to set your proxy settings on your machine in order to support a local '.test' TLD. After you click OK, a password dialog will popup asking you to change your network settings. Don't be alarmed! \n\nNow, instead of going to http://localhost:3013 to visit the test server locally, go to http://expo-test-server.test.\" buttons {\"OK\"} with icon stop"
  networksetup -setautoproxyurl "$NETWORK" "$PROXY_URL"
fi
