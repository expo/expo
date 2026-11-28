# Runs an update, then rolls back to the embedded update, and checks the update ID headers of each
# request.

before_each
serve_manifest test-update-before-rollback
js "output.updateBeforeRollbackId = '$SERVED_UPDATE_ID'" > /dev/null
launch_app
expect_values updateString=test
js "output.firstRequestHeaders = api.lastRequestHeaders()" > /dev/null
sleep 3
stop_app
launch_app
expect_values updateString=test-update-3
js "output.secondRequestHeaders = api.lastRequestHeaders()" > /dev/null
stop_app
# shellcheck disable=SC2119 # No query: restart with the default server settings.
restart_updates_server
serve_manifest test-rollback
launch_app
expect_values updateString=test-update-3
js "output.thirdRequestHeaders = api.lastRequestHeaders()" > /dev/null
sleep 3
stop_app
launch_app
expect_values updateString=test
js "output.fourthRequestHeaders = api.lastRequestHeaders()" > /dev/null
expect_js "The first request sends the embedded update as the current update" \
  "output.firstRequestHeaders['expo-embedded-update-id'] == output.firstRequestHeaders['expo-current-update-id']"
expect_js "The second request sends the same embedded update ID" \
  "output.secondRequestHeaders['expo-embedded-update-id'] == output.firstRequestHeaders['expo-embedded-update-id']"
expect_js "The third request sends the same embedded update ID" \
  "output.thirdRequestHeaders['expo-embedded-update-id'] == output.firstRequestHeaders['expo-embedded-update-id']"
expect_js "The fourth request sends the same embedded update ID" \
  "output.fourthRequestHeaders['expo-embedded-update-id'] == output.firstRequestHeaders['expo-embedded-update-id']"
expect_js "The second request sends the downloaded update as the current update" \
  "output.secondRequestHeaders['expo-current-update-id'] == output.updateBeforeRollbackId"
expect_js "The third request sends the downloaded update as the current update" \
  "output.thirdRequestHeaders['expo-current-update-id'] == output.updateBeforeRollbackId"
expect_js "The fourth request sends the embedded update as the current update" \
  "output.fourthRequestHeaders['expo-current-update-id'] == output.firstRequestHeaders['expo-embedded-update-id']"
stop_app
