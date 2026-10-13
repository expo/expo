---
'expo-router': major
---

[iOS] Headers now use the system bar appearance by default: transparent, with Liquid Glass on iOS 26+ or `systemChromeMaterial` blur on earlier versions, and content under the header.

To make content start below the header, add `contentInsetAdjustmentBehavior="automatic"` to the screen's root `ScrollView`, `FlatList`, or `SectionList`. For a screen without a scroll view, pad it with `useHeaderHeight()` from `expo-router/react-navigation`, or set `headerTransparent: false` to keep the opaque header.

```tsx
<ScrollView contentInsetAdjustmentBehavior="automatic">{/* ... */}</ScrollView>
```

On iOS, the header title color, the native button tint, and the header fonts no longer come from the navigation theme (`colors.text`, `colors.primary`, `fonts`). Set `headerTintColor` or `headerTitleStyle` to keep custom values. `headerTransparent: false` brings back only the opaque background.

On Android, the default native header title uses the platform fonts.
