---
'expo-audio': patch
---

[Web] Fixed an uncaught promise rejection, and `playing` staying `true`, when the browser blocks playback before the user interacts with the page. The player now reports the rejection in `error` on its status ([#36264](https://github.com/expo/expo/issues/36264)).
