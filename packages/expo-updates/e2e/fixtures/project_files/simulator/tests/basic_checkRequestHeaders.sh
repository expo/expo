# Checks the headers of the first update request.

before_each
launch_app
expect_values updateString=test
expect_js "The request has the host header" \
  "api.lastRequestHeaders().host == 'localhost:$UPDATES_SERVER_PORT'"
expect_js "The request has the channel name header" \
  "api.lastRequestHeaders()['expo-channel-name'] == 'default'"
expect_js "The request has the runtime version header" \
  "api.lastRequestHeaders()['expo-runtime-version'] == '1.0.0'"
stop_app
