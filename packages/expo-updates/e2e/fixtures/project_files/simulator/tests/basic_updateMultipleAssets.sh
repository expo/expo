# Downloads and runs an update with multiple assets, and checks the asset requests.

before_each
serve_manifest test-update-with-multiple-assets
launch_app
expect_values updateString=test
sleep 3
expect_js "The app requested 4 static files" "api.staticFileCount() == 4"
stop_app
launch_app
expect_values updateString=test-update-2
expect_js "The asset request has the host header" \
  "api.lastAssetRequestHeaders().host == 'localhost:$UPDATES_SERVER_PORT'"
expect_js "The asset request has the channel name header" \
  "api.lastAssetRequestHeaders()['expo-channel-name'] == 'default'"
expect_js "The asset request has the runtime version header" \
  "api.lastAssetRequestHeaders()['expo-runtime-version'] == '1.0.0'"
stop_app
