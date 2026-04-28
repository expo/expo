# `@expo/ui/community/bottom-sheet`

A drop-in replacement for [`@gorhom/bottom-sheet`](https://github.com/gorhom/react-native-bottom-sheet) using native platform bottom sheets.

- **iOS**: SwiftUI sheet presentation with detents
- **Android**: Material 3 ModalBottomSheet with `expand()`/`partialExpand()` native methods
- **Web**: [vaul](https://github.com/emilkowalski/vaul) drawer with spring-physics gestures

## Installation

No extra dependencies needed beyond `@expo/ui`. vaul is bundled for web.

## Usage

```tsx
import { useRef } from 'react';
import { Button, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@expo/ui/community/bottom-sheet';

export default function App() {
  const sheetRef = useRef<BottomSheet>(null);

  return (
    <View style={{ flex: 1 }}>
      <Button title="Open" onPress={() => sheetRef.current?.snapToIndex(0)} />

      <BottomSheet
        ref={sheetRef}
        snapPoints={['25%', '50%', '90%']}
        index={-1}
        onChange={(index) => console.log('onChange', index)}
        onClose={() => console.log('closed')}
        enablePanDownToClose
      >
        <BottomSheetView style={{ flex: 1, padding: 24, alignItems: 'center' }}>
          <Text>Sheet Content</Text>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
```

## Migration from `@gorhom/bottom-sheet`

Update your imports:

```diff
-import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
+import BottomSheet, { BottomSheetView } from '@expo/ui/community/bottom-sheet';
```

That's it. Ref types (`useRef<BottomSheet>`, `useRef<BottomSheetModal>`), methods (`present()`, `dismiss()`, `snapToIndex()`, `expand()`, `collapse()`, `close()`), `BottomSheetModalProvider`, and all other APIs work without changes.

`GestureHandlerRootView` (from `react-native-gesture-handler`) is unrelated to `@gorhom/bottom-sheet` and can be left in place or removed — this implementation does not require it.

## Compatibility

### Behavioral difference: modal vs inline

`@gorhom/bottom-sheet`'s `BottomSheet` renders **inline** — a View at the bottom of its container, always mounted and visible at some snap point height. This component uses **native modal** presentation on iOS and Android — an overlay that is either presented or dismissed. On web, vaul renders a drawer overlay.

**What this means:**

- The "open, interact, close" flow works the same way
- Pan-down-to-close works (`enablePanDownToClose`)
- Snap points and ref methods work
- A scrim/backdrop is always present (gorhom has none by default)
- The "persistent peek" pattern (e.g., a 10% strip always visible at the bottom like Google Maps) does not work — the sheet is either fully presented or hidden
- On iOS, `enablePanDownToClose` enables both swipe-to-dismiss and backdrop tap dismiss — SwiftUI does not allow separating these behaviors

### Exports

| Export | Supported | Notes |
|--------|-----------|-------|
| `BottomSheet` (default) | Yes | Modal on iOS/Android, vaul drawer on web |
| `BottomSheetView` | Yes | Pass-through `View` wrapper (strips `flex` for fit-to-content) |
| `BottomSheetScrollView` | Yes | Re-export of `ScrollView` |
| `BottomSheetFlatList` | Yes | Re-export of `FlatList` |
| `BottomSheetSectionList` | Yes | Re-export of `SectionList` |
| `BottomSheetTextInput` | Yes | Re-export of `TextInput` |
| `BottomSheetModal` | Yes | Starts closed, opened via `present()` |
| `BottomSheetModalProvider` | Yes | No-op wrapper for compatibility |
| `useBottomSheet` | Yes | Context-based, returns ref methods |
| `BottomSheetBackdrop` | No | Native/vaul handles backdrop |
| `BottomSheetHandle` | No | Native/vaul handles drag indicator |
| `BottomSheetFooter` | No | No equivalent |
| `BottomSheetDraggableView` | No | Not applicable |
| `BottomSheetVirtualizedList` | No | Use `FlatList` instead |
| `BottomSheetFlashList` | No | Use `FlatList` instead |
| `useBottomSheetModal` | No | Use `useBottomSheet` instead |
| `useBottomSheetSpringConfigs` | No | Native/vaul handles animations |
| `useBottomSheetTimingConfigs` | No | Native/vaul handles animations |

### Props

| Prop | Supported | Notes |
|------|-----------|-------|
| `snapPoints` | Yes | iOS: full support. Android: 2 states (partial/expanded). Web: full support via CSS height. |
| `index` | Yes | `-1` = closed, `0+` = open at snap point. Default `-1` (gorhom defaults `0`). |
| `onChange` | Yes | |
| `onClose` | Yes | |
| `onDismiss` | Yes | Alias for `onClose` (gorhom `BottomSheetModal` compat) |
| `enablePanDownToClose` | Yes | iOS: enables swipe + backdrop tap. Android: swipe + back button + scrim tap. |
| `enableDynamicSizing` | Yes | Fit-to-content when no `snapPoints`. Cannot combine with explicit snap points. |
| `handleComponent` | Partial | `null` hides handle, non-null shows native/vaul handle. Custom components not rendered. |
| `backgroundStyle` | Partial | Android: `backgroundColor` extracted for `containerColor`. iOS: not applied (SwiftUI sheet uses system background). Web: full style is applied. |
| `style` | Partial | Passed through where possible |
| `children` | Yes | |
| `animateOnMount` | No | Accepted, no effect. |
| `enableContentPanningGesture` | No | Accepted, no effect. |
| `enableHandlePanningGesture` | No | Accepted, no effect. |
| `enableOverDrag` | No | Accepted, no effect. |
| `overDragResistanceFactor` | No | Accepted, no effect. |
| `keyboardBehavior` | No | Accepted, no effect. |
| `keyboardBlurBehavior` | No | Accepted, no effect. |
| `backdropComponent` | No | Accepted, no effect. |
| `backgroundComponent` | No | Accepted, no effect. |
| `footerComponent` | No | Accepted, no effect. |
| `handleStyle` | No | Accepted, no effect. |
| `handleIndicatorStyle` | No | Accepted, no effect. |
| `containerStyle` | No | Accepted, no effect. |
| `animatedIndex` | No | Not supported |
| `animatedPosition` | No | Not supported |
| `animationConfigs` | No | Not supported |
| `detached` | No | Not supported |

### Ref methods

| Method | Supported | Notes |
|--------|-----------|-------|
| `snapToIndex(index)` | Yes | Android: maps to `expand()`/`partialExpand()` (2 states) |
| `snapToPosition(position)` | Partial | Mapped to nearest snap point |
| `expand()` | Yes | |
| `collapse()` | Yes | |
| `close()` | Yes | |
| `forceClose()` | Yes | Same as `close()` |
| `present()` | Yes | Opens at first snap point |
| `dismiss()` | Yes | Same as `close()` |

### Platform-specific snap point behavior

| Snap points | iOS | Android | Web |
|-------------|-----|---------|-----|
| `['25%']` | Single detent at 25% | Expanded (skips partial) | Single height at 25% |
| `['25%', '50%']` | Two detents | Partial (~50%) + expanded | Two heights |
| `['25%', '50%', '90%']` | Three detents | Partial + expanded (middle ignored) | Three heights |
| `[200, 500]` | Two height detents | Partial + expanded | Two heights |
| Not provided | `medium` + `large` | Fit to content | Fit to content |
