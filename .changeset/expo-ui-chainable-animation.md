---
'@expo/ui': patch
---

[iOS] Fixed `delay()` and `repeat()` modifying the animation they are called on. Chaining from a shared animation, such as `Animation.default` or one stored in a constant, no longer changes that animation everywhere else it is used.
