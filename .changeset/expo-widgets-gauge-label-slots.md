---
'expo-widgets': patch
---

[iOS] Fix `Gauge` labels (`currentValueLabel`, `minimumValueLabel`, `maximumValueLabel`) and custom `Label` titles and icons not rendering inside widgets and Live Activities. The renderer now passes children to these views, so their slots resolve.
