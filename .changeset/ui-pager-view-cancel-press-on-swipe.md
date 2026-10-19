---
'@expo/ui': patch
---

[iOS] Stop the community `PagerView` from pressing a `Pressable` on a page when a swipe starts or ends on it, or when a tap stops a moving page. The pager now takes the touch from its pages while it scrolls, like React Native's `ScrollView`. This needs iOS 18 or later.
