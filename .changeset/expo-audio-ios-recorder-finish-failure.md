---
'expo-audio': patch
---

[iOS] Report a recording that does not finish successfully as an error. The `recordingStatusUpdate` event now has `hasError: true`, an error message, and no `url`. Before this change, the event reported a successful recording.
