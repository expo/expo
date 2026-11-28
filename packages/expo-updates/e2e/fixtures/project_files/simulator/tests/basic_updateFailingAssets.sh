# An update whose assets fail in different ways logs one warning for each asset, and one error for
# each kind of failure.

before_each
serve_manifest test-update-with-failing-assets
launch_app
expect_values updateString=test
# The request for failing-asset3 never gets a response, so the app reports it only after the
# request times out: after at least 10 s on Android, and 60 s on iOS.
deadline=$((SECONDS + 90))
until tap readLogEntries && expect_js "The app logged the unreachable asset" \
  "api.logEntriesWithLevelAndCode('error', 'UpdateServerUnreachable').length > 0" 2> /dev/null; do
  if ((SECONDS >= deadline)); then
    echo "Failed: the app did not log the unreachable asset in 90 s." >&2
    return 1
  fi
done
expect_js "The app logged 2 AssetsFailedToLoad errors" \
  "api.logEntriesWithLevelAndCode('error', 'AssetsFailedToLoad').length == 2"
expect_js "One error names the two assets that returned 404" \
  "api.logEntriesWithLevelAndCode('error', 'AssetsFailedToLoad').some(function (e) { return e.message.includes('failing-asset0') && e.message.includes('failing-asset1') && e.message.includes('404'); })"
expect_js "One error names the asset that returned 500" \
  "api.logEntriesWithLevelAndCode('error', 'AssetsFailedToLoad').some(function (e) { return e.message.includes('(failing-asset2)') && e.message.includes('500'); })"
expect_js "One UpdateServerUnreachable error names the unreachable asset" \
  "(function (errors) { return errors.length == 1 && errors[0].message.includes('(failing-asset3)'); })(api.logEntriesWithLevelAndCode('error', 'UpdateServerUnreachable'))"
expect_js "The AssetsFailedToLoad errors have the expected key and values" \
  "(function (errors) { return errors.every(function (e) { return e.key == 'remote.assetsFailed'; }) && errors.some(function (e) { return e.values.httpStatus == '404' && e.values.count == '2'; }); })(api.logEntriesWithLevelAndCode('error', 'AssetsFailedToLoad'))"
expect_js "The UpdateServerUnreachable error has the expected key and values" \
  "(function (errors) { return errors[0].key == 'remote.assetsUnreachable' && errors[0].values.assetKeys == 'failing-asset3'; })(api.logEntriesWithLevelAndCode('error', 'UpdateServerUnreachable'))"
expect_js "The app logged 3 assetDownloadFailed entries" \
  "api.logEntries().filter(function (e) { return e.key == 'remote.assetDownloadFailed' && e.assetId && e.assetId.indexOf('failing-asset') == 0; }).length == 3"
expect_js "The app logged 1 assetDownloadUnreachable entry" \
  "api.logEntries().filter(function (e) { return e.key == 'remote.assetDownloadUnreachable' && e.assetId == 'failing-asset3'; }).length == 1"
expect_js "The app logged 4 asset warnings" \
  "api.logEntries().filter(function (e) { return e.level == 'warn' && e.assetId && e.assetId.indexOf('failing-asset') == 0; }).length == 4"
stop_app
