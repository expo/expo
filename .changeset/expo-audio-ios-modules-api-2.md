---
'expo-audio': patch
---

[iOS] Migrate the module, `AudioRecorder` and `AudioStream` to the Expo Modules API 2.0. An argument of the wrong type now rejects with an error that has no `code`, instead of `ERR_ARGUMENT_CAST`.
