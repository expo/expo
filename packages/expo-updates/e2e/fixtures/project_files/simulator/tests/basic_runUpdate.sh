# Downloads an update on startup and runs it on the next launch.

before_each
serve_manifest test-update-basic
launch_app
expect_values updateString=test
expect_values state.downloadProgress=1
stop_app
launch_app
expect_values updateString=test-update-1
stop_app
