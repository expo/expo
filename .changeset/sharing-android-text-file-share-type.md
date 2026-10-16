---
'expo-sharing': patch
---

[Android] Classify `text/*` attachments that reach the URI parser as `file` instead of `text`, since their value is a content URI. This covers multi-file shares and single-file shares whose intent MIME type is not `text/plain`. Resolved `contentType` is unchanged.
