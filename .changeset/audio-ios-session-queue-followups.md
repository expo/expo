---
'expo-audio': patch
---

[iOS] Fix interruption bookkeeping (`interruptedPlayers`/`playerVolumes`) racing the queued resume path: the snapshot is taken on the notification thread, and the collections are only written on the session queue.

[iOS] `setIsAudioActiveAsync` settles its promise from the session queue instead of blocking the shared AsyncFunction queue via `sessionQueue.sync`.

[iOS] Pause the player and log a warning when the audio session cannot be activated during `AudioPlayer.play()`, instead of leaving playback started on an inactive session (activation is async, so `play()` cannot throw for it).
