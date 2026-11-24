# Starts the app, stops it, and starts it again.

before_each
launch_app
expect_values updateString=test
stop_app
launch_app
expect_values updateString=test
stop_app
