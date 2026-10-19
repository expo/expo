---
'@expo/cli': patch
---

Fix native builds from `expo run:android` and `expo run:ios` bundling with the CLI's development `BABEL_ENV`. `BABEL_ENV` now always follows the command's mode, even when it's already set.
