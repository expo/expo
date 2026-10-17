---
'@expo/ui': patch
---

[web] Fix the universal `Text` ignoring the `colorScheme` of its `Host`. Its default color followed the browser color scheme, so a `Text` in a dark `Host` was black in a light browser. It now uses the `Host` foreground color and keeps the old color when no `Host` is on the page.
