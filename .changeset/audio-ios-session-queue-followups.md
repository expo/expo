---
'expo-audio': patch
---

[iOS] Fix interruption bookkeeping (`interruptedPlayers`/`playerVolumes`) racing the queued resume path: the snapshot is taken on the notification thread, and the collections are only written on the session queue.

[iOS] `setIsAudioActiveAsync` settles its promise from the session queue instead of blocking the shared AsyncFunction queue via `sessionQueue.sync`.

[iOS] Surface audio-session activation failures during `AudioPlayer.play()` through the `playbackStatusUpdate` event's existing `error` field (activation is async, so `play()` cannot throw for them).
