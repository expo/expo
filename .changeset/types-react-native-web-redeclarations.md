---
'expo': patch
---

Stop `expo/types` redeclaring web style members that React Native 0.88 declares itself. The duplicate declarations made `ViewStyle` unassignable to `View`, and `ViewProps` unassignable to `Pressable`.

`position: 'fixed' | 'sticky'` and the wider web `cursor` set are no longer typed. React Native declares `position` as `'absolute' | 'relative' | 'static'` and `cursor` as `CursorValue`, so redeclaring them here widened the public interface away from the type the component actually accepts. They can be restored once [the augmentable style types](https://github.com/react/react-native/pull/58168) reach a React Native release.
