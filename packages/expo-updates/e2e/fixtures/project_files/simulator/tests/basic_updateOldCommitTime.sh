# Does not download any assets for an update with an older commit time.

before_each
serve_manifest test-update-with-older-commit-time
launch_app
expect_values updateString=test
sleep 3
expect_js "The app requested no static files" "api.staticFileCount() == 0"
stop_app
launch_app
expect_values updateString=test
stop_app
