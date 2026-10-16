---
'@expo/schema-utils': patch
---

Fix `visit` reporting every `oneOf` and `anyOf` branch, and both `then` and `else`, whatever the value. It now visits only the branches that apply to the value, and a matching `if` itself. A boolean `if` selects `then` or `else`. A branch that cannot be evaluated, such as one with an unsupported `format`, is still visited.
