---
'expo-observe': patch
---

[Android] Send OTLP `intValue` attributes as JSON numbers, as iOS does. The server rejected logs and traces that had an integer attribute written as a string.
