---
'@expo/cli': patch
---

Keep the dev server running when a client disconnects mid-frame on the network inspector websocket. A truncated or corrupt compressed frame on `/inspector/network` now closes that connection instead of exiting `expo start` with `Z_DATA_ERROR`.
