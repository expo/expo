---
'@expo/cli': patch
---

Fix `expo run:ios` and `expo run:android` opening the app at a busy port that another project serves. When you decline to use another port, the command now stops with `PORT_IN_USE`. When the port prompt can't be shown, a default port moves to the next free one, and an explicit `--port` stops with `PORT_IN_USE`.
