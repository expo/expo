# Overrides the request headers with the JS API to get updates from another channel, then removes
# the override.

# Usage: expect_no_update_available. Checks for an update, and checks that none is available.
expect_no_update_available() {
  tap checkForUpdate
  sleep 1
  expect_values availableUpdateID=undefined
}

# Usage: run_available_update UPDATE_ID CHANNEL. Checks for an update, downloads it, reloads, and
# checks that the update runs from CHANNEL.
run_available_update() {
  tap checkForUpdate
  expect_values "availableUpdateID=$1"
  tap downloadUpdate
  expect_values state.isUpdatePending=true
  tap reload
  expect_values "channel=$2" "updateID=$1"
}

before_each
launch_app
expect_values updateString=test channel=default

# An update on the preview channel runs only with the override.
serve_manifest test-update-basic preview
expect_no_update_available
tap toggleUpdateRequestHeadersOverride
run_available_update "$SERVED_UPDATE_ID" preview

# An update on the default channel runs only without the override.
serve_manifest test-update-basic default
expect_no_update_available
tap toggleUpdateRequestHeadersOverride
run_available_update "$SERVED_UPDATE_ID" default
stop_app
