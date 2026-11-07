---
'@expo/router-server': patch
---

Render the web document with the same `<html>` and `<body>` shape that the browser hydrates, so `useId` values in the server HTML match the browser for `output: 'server'` and `output: 'static'`. The `+html` component still runs on the server only. Elements in its `<body>` other than `children` and `bodyNodes` move into a `<div style="display: contents">` after the app, with a warning.
