# An update whose assets already ship in the app binary must not download them again. The served
# manifest lists every embedded asset plus one asset that is not embedded, so the app fetches only
# the JS bundle and that one asset.

before_each
serve_manifest test-update-for-asset-deletion
launch_app
expect_values updateString=test
sleep 5
expect_js "The app requested only the bundle and the asset that is not embedded" \
  "api.staticFileCount() == 2"
stop_app
launch_app
expect_values updateString=test-assets-1
tap readAssetFiles
expect_app_js numAssetFiles "The app has asset files" "parseInt(copiedText, 10) > 0"
stop_app
