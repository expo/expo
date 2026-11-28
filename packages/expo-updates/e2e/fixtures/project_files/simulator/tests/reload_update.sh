# Downloads an update, then reloads with the JS API and checks that the new bundle runs.
# basic_reload.sh reloads with no update available, so it passes whether or not the bundle swaps.
#
# The manifest is served only after the first launch. Otherwise the app updates on startup and
# never runs the embedded bundle.

before_each
launch_app
sleep 3
expect_values updateString=test
serve_manifest test-update-basic
tap downloadUpdate
expect_values state.isUpdatePending=true
tap reload
expect_values updateString=test-update-1
stop_app
