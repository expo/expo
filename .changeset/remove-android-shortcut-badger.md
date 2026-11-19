---
"expo-notifications": patch
---

Remove the Android ShortcutBadger dependency. On Android, `setBadgeCountAsync` now returns `false` for nonzero counts, and `getBadgeCountAsync` always returns `0`. Setting the count to `0` still dismisses all notifications. Badges from active notifications remain supported.
