# Reloads the app with no update available.

before_each
launch_app
expect_values updateString=test
tap reload
sleep 2
expect_values updateString=test
stop_app
launch_app
expect_values updateString=test
stop_app
