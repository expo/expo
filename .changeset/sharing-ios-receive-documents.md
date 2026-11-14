---
'expo-sharing': patch
---

[iOS] Fix the share extension dropping files shared into the app. Documents that register only their own type, such as `.pptx` and `.docx`, are now received as files. Text files that arrive as file URLs are now received as files instead of being dropped. Files from document providers, such as iCloud Drive, are now copied with security-scoped access. Files that arrive as data now keep the sender's file name.
