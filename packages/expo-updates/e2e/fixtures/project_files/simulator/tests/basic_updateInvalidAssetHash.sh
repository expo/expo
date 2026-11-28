# Does not run an update with an incorrect asset hash, and logs the expected entry.

before_each
serve_manifest test-update-with-invalid-asset-hash
launch_app
expect_values updateString=test
sleep 3
expect_js "The app requested 4 static files" "api.staticFileCount() == 4"
stop_app
launch_app
expect_values updateString=test
tap readLogEntries
expect_js "The app sent log entries" "api.logEntries().length > 0"
expect_js "The log entries include AssetsFailedToLoad" \
  "JSON.stringify(api.logEntries()).includes('AssetsFailedToLoad')"
stop_app
