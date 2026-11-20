---
'expo-router': patch
---

Match redirect and rewrite sources against the full path in the app, the same as the server. Use a catch-all source such as `/old/[...path]` to redirect child paths.
