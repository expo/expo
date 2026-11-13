---
"expo-updates": minor
---

[Android] Every warning and error that `expo-updates` logs has a key. Some messages change to the template of their key. The reaper, manifest metadata reads and the code signing algorithm check log through the updates log instead of `android.util.Log`, and a code signing failure is logged once instead of twice.
