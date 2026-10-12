---
'expo-modules-core': patch
'@expo/ui': patch
---

[iOS] A `Host` that fills its height now registers its hosted `List`, `ScrollView` or `Form` as the screen's content scroll view, so a native stack header tracks it: large titles collapse on scroll and the bar switches to its scrolled appearance. Before, UIKit only found scroll views along the first-subview chain and never reached into the `Host`.
