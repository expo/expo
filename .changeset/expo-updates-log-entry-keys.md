---
"expo-updates": minor
---

Log entries from `readLogEntriesAsync` can have a `key` and `values`. The key names the event and stays the same when the message text changes, and the values fill the message template, such as `cause` or `assetKey`. Update check, update download and remote load failures are the first entries with keys.

The messages of these failures change: an entry for a network failure starts with "Could not reach the update server", and an entry for a group of failed assets is "Failed to load {count} asset(s) ({assetKeys}): {cause}", without the text of the failed operation before it.
