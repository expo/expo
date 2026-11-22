---
'@expo/ui': patch
---

[iOS] Fix `maxLength` in `TextField`, `SecureField` and the universal `TextInput` counting characters rather than UTF-16 code units, which let ten 👍 into a field with `maxLength={10}`. iOS now counts UTF-16 code units, as Android, web and React Native's `TextInput` do, and cuts text between characters.
