---
'expo-ai': patch
---

Fix structured output failing with `ERR_VALIDATION_RETRIES_EXHAUSTED`. On web, schemas with `minimum` or `maximum` now go to the browser Prompt API as a response constraint. On Android and other providers without native constraints, the prompt asks for raw JSON and replies wrapped in Markdown code fences are accepted.
