# Checks that the app restores missing assets of a downloaded update. The flow runs an update with
# multiple assets, then deletes the asset files from .expo-internal (but not from SQLite). This
# simulates a bug that deletes assets, or the OS deleting files when storage is low. The recovery
# code is in DatabaseLauncher. The UpdatesE2ETestModule reads and clears the asset files.

before_each
serve_manifest test-update-with-multiple-assets
launch_app
sleep 3
stop_app
launch_app
expect_values updateString=test-update-2
tap readAssetFiles
expect_app_js numAssetFiles "The update has more than 2 asset files" "parseInt(copiedText, 10) > 2"
tap clearAssetFiles
expect_values numAssetFiles=0
stop_app
launch_app
expect_values updateString=test-update-2
sleep 3
tap readAssetFiles
expect_app_js numAssetFiles "The app restored the asset files" "parseInt(copiedText, 10) > 2"
stop_app
