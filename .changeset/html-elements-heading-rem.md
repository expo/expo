---
'@expo/html-elements': patch
---

Use `rem` for heading font sizes on web so a heading keeps the root font size when a parent sets a smaller font. Headings nested in a parent with a custom font size no longer scale with that parent on web.
