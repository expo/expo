---
'@expo/ui': patch
---

[iOS] Apply the `underline` and `strikethrough` modifiers to a nested `Text`. Before, a nested `Text` dropped them, and a debug build showed a "not supported for nested Text" warning.
