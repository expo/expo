---
'@expo/ui': patch
---

[iOS] Add `cornerRadius` and `opacity` to `Chart`'s `pieStyle`. Pie slices could not have rounded corners, and their opacity was fixed at 0.8, so a chart drawn in solid colors always looked washed out. Both default to the previous behavior. Rounded corners let a single-slice donut work as a progress ring with rounded ends.
