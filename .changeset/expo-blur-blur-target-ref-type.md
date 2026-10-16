---
'expo-blur': patch
---

Accept a `View` ref from React Native 0.87 and later in the `blurTarget` prop and the `BlurTargetView` `ref` prop. The prop types now use `ComponentRef<typeof View>`, so `useRef<ViewInstance>(null)` and `useRef<ComponentRef<typeof View>>(null)` type-check with the default React Native typings. With the default typings, a ref typed `useRef<View | null>(null)` no longer type-checks for these props. Type it as `useRef<ComponentRef<typeof View>>(null)` instead.
