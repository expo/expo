---
'@expo/router-server': patch
---

Send server-rendered pages (`web.output: "server"`) once all Suspense boundaries have resolved when the `streaming` option of the `expo-router` config plugin is `false`, instead of streaming them.
