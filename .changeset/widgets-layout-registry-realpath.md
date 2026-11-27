---
'expo-widgets': patch
---

[iOS] Fix the layout registry build failing with `Unable to resolve module` when the project path contains a symlink, for example under `/var/folders` on macOS, where `eas build --local` builds.
