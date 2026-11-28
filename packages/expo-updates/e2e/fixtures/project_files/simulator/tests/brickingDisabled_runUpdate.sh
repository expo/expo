# Sets the update URL with the JS API, then checks that the next launch runs the update from
# that URL.

before_each
restart_updates_server serveOverriddenUrl=true
serve_manifest test-update-basic
launch_app
expect_update_string test
tap setUpdateURLAndRequestHeadersOverride
sleep 3
stop_app
launch_app
expect_update_string test-update-1
stop_app
