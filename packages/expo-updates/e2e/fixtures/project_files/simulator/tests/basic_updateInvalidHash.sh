# Does not run an update with an incorrect hash.

before_each
serve_manifest test-update-invalid-hash
launch_app
expect_values updateString=test
sleep 3
stop_app
launch_app
expect_values updateString=test
stop_app
