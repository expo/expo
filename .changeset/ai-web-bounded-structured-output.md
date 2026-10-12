---
'expo-ai': patch
---

Fix structured output and categorize failing with `ERR_VALIDATION_RETRIES_EXHAUSTED` on web and Android. Replies wrapped in Markdown code fences are now accepted, and schemas whose top level is not an object, such as the string enum that categorize uses, now work. On web, schemas with `minimum` or `maximum` now go to the browser Prompt API as a response constraint.
