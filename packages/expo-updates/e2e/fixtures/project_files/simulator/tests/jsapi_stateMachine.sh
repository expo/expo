# Checks the updates state at each point in the update lifecycle.

before_each

# The first launch runs the embedded bundle.
launch_app
expect_values updateString=test \
  state.isUpdatePending=false \
  state.isUpdateAvailable=false \
  state.isRollback=false \
  state.latestManifest.id=null \
  state.downloadedManifest.id=null \
  state.downloadProgress=0 \
  nativeInterfaceState.downloadTimeMs=null

# After checkForUpdate, an update is available but not downloaded.
serve_manifest test-update-basic
update_id=$SERVED_UPDATE_ID
sleep 0.5
tap checkForUpdate
expect_values state.isUpdatePending=false \
  state.isUpdateAvailable=true \
  "state.latestManifest.id=$update_id" \
  state.downloadedManifest.id=null \
  nativeInterfaceState.type=checkCompleteWithUpdate

# After downloadUpdate, the update is downloaded but not launched.
tap downloadUpdate
expect_values state.isUpdatePending=true \
  state.isUpdateAvailable=true \
  "state.latestManifest.id=$update_id" \
  "state.downloadedManifest.id=$update_id" \
  nativeInterfaceState.type=downloadCompleteWithUpdate \
  "nativeInterfaceState.availableUpdateId=$update_id" \
  state.downloadProgress=1
expect_app_js nativeInterfaceState.downloadTimeMs "The download time is set" "copiedText != 'null'"

# After a restart, the update runs.
# shellcheck disable=SC2119 # No query: restart with the default server settings.
restart_updates_server
stop_app
launch_app
expect_values updateString=test-update-1 \
  state.isUpdatePending=false \
  state.isUpdateAvailable=false \
  state.isRollback=false \
  state.latestManifest.id=null \
  state.downloadedManifest.id=null
# iOS shows the launched update ID in upper case.
expect_app_js nativeInterfaceState.launchedUpdateId "The downloaded update runs" \
  "copiedText.toLowerCase() == '$update_id'.toLowerCase()"

# After checkForUpdate with a rollback served, a rollback is available.
# shellcheck disable=SC2119 # No query: restart with the default server settings.
restart_updates_server
serve_manifest test-rollback
sleep 0.5
tap checkForUpdate
expect_values state.isUpdatePending=false \
  state.isUpdateAvailable=true \
  state.isRollback=true \
  state.latestManifest.id=null \
  state.downloadedManifest.id=null \
  nativeInterfaceState.type=checkCompleteWithRollback
stop_app
