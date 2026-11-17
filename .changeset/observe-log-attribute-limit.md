---
'expo-observe': patch
---

Send at most 128 attributes for each log event, and keep the `expo.*` attributes first, so the server does not drop them.
