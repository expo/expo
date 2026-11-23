---
'expo-audio': minor
---

[iOS] Use `expo-media-session` for the audio session, so `expo-audio` and other libraries that use `expo-media-session` share one session instead of overwriting each other's configuration. Behavior changes:

- The session deactivates 1 second after the last player, recorder, or stream stops, instead of after 100 milliseconds. In `mixWithOthers` mode, it is not deactivated automatically.
- A recorder no longer replaces the session category. The session uses one category for every player, recorder, and stream that is active.
- `setIsAudioActiveAsync(true)` no longer activates the session at once. The next `play()` activates it. `setIsAudioActiveAsync(false)` deactivates the session only when no other library uses it.
- A player that was ducked during an interruption gets its volume back when the interruption ends without resuming playback.
- An app that never calls `setAudioModeAsync` now plays in the `playback` category with `mixWithOthers`, so audio plays with the ringer switch off and mixes with other apps. Before, the iOS default session silenced it and stopped other apps.
- An `AudioStream` pauses when the app goes to the background, unless `allowsBackgroundRecording` is `true`.
- When a recording loses the audio session, for example after an interruption that does not resume, the recorder stops and finishes the file. A later `record()` throws until `prepareToRecordAsync()` is called again.
