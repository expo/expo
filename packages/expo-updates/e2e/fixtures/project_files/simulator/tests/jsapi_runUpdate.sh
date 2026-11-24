# Uses the checkForUpdate and downloadUpdate JS APIs to download and run an update.

before_each
serve_manifest test-update-basic
downloaded_update_id=$SERVED_UPDATE_ID
launch_app
expect_values updateString=test isEmbeddedLaunch=true
expect_app_js updateID "The embedded update runs" "copiedText != '$downloaded_update_id'"
sleep 3
stop_app
launch_app
expect_values updateString=test-update-1
stop_app
launch_app
expect_values isEmbeddedLaunch=false checkAutomatically=ON_LOAD "updateID=$downloaded_update_id"
expect_app_js launchDuration "The launch duration is set" "parseInt(copiedText, 10) > 0"
tap setExtraParams
expect_app_js extraParamsString "The extra params are set" \
  "copiedText.includes('testparam') && copiedText.includes('testvalue') && !copiedText.includes('testsetnull')"
# shellcheck disable=SC2119 # No query: restart with the default server settings.
restart_updates_server
serve_manifest test-update-with-multiple-assets
downloaded_update_id=$SERVED_UPDATE_ID
tap checkForUpdate
expect_values "availableUpdateID=$downloaded_update_id"
tap downloadUpdate
expect_values state.isUpdatePending=true
stop_app
launch_app
expect_values "updateID=$downloaded_update_id"
stop_app
