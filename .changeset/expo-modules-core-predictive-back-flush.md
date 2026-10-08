---
'expo-modules-core': patch
---

[Android] Fix views sized by Jetpack Compose, such as `RNHostView` in a `ModalBottomSheet`, that kept their old size until the keyboard animation ended when the keyboard was dismissed with the predictive back gesture.
