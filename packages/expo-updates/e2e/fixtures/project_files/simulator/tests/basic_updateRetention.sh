# Launches four updates in a row, and checks the cached update IDs after each launch. The newest
# updates up to the maxUpdatesToKeep limit stay, and older downloaded updates are removed. The
# embedded update is not counted.

# Usage: read_cached_updates EXPRESSION. Taps readCachedUpdateIds until EXPRESSION is true, with
# copiedText set to the cachedUpdates JSON. Tries 10 times.
read_cached_updates() {
  for _ in $(seq 1 10); do
    tap readCachedUpdateIds
    if read_text cachedUpdates && [[ "$(js "$1")" == "true" ]]; then
      return 0
    fi
  done
  echo "Failed: the cached updates did not match: $1. cachedUpdates is \"$COPIED_TEXT\"." >&2
  return 1
}

before_each
launch_app
read_text updateID
js "output.embeddedId = copiedText, output.downloadedIds = []" > /dev/null
read_cached_updates "JSON.parse(copiedText).maxUpdatesToKeep != null"
js "output.retentionLimit = JSON.parse(copiedText).maxUpdatesToKeep" > /dev/null
for _ in 1 2 3 4; do
  stop_app
  serve_manifest test-update-basic
  launch_app
  expect_values --timeout 30000 "state.downloadedManifest.id=$SERVED_UPDATE_ID"
  stop_app
  launch_app
  expect_values --timeout 60000 "updateID=$SERVED_UPDATE_ID"
  js "output.downloadedIds.push('$SERVED_UPDATE_ID'), output.expectedIds = JSON.stringify(output.downloadedIds.slice(-output.retentionLimit).sort())" > /dev/null
  # Removal of old updates runs in the background after launch.
  read_cached_updates "(function (snapshot) { return !snapshot.pending && !snapshot.error && JSON.stringify(snapshot.updateIds.filter(function (id) { return id != output.embeddedId; }).sort()) == output.expectedIds; })(JSON.parse(copiedText))"
done
stop_app
