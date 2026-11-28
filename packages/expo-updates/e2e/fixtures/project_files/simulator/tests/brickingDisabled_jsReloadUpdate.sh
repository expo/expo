# Sets the update URL with the JS API, downloads the update from that URL, and reloads the app
# with the JS API to run it.

before_each
restart_updates_server serveOverriddenUrl=true
serve_manifest test-update-basic
launch_app
expect_values updateString=test
tap setUpdateURLAndRequestHeadersOverride
sleep 3
tap downloadUpdate
sleep 3
tap reload
expect_values updateString=test-update-1
stop_app
