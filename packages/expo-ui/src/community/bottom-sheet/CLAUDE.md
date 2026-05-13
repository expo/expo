# `@expo/ui/community/bottom-sheet`

Drop-in replacement for `@gorhom/bottom-sheet` using native platform bottom sheets.

## Architecture

```
index.tsx              Barrel exports, BottomSheetModal wrapper, BottomSheetView (flex stripping)
context.tsx            Shared BottomSheetContext (methods) + BottomSheetInternalContext (fitToContents)
types.ts               gorhom-compatible type definitions with @remarks TSDoc
BottomSheet.ios.tsx    SwiftUI .sheet() + presentationDetents
BottomSheet.android.tsx Material3 ModalBottomSheet + expand()/partialExpand()
BottomSheet.tsx        vaul drawer (web default)
```

### Platform implementations

- **iOS**: Wraps `swift-ui/BottomSheet` + `Group` (presentation modifiers) + `RNHostView`. Two-state pattern (`isMounted`/`isPresented`) for animated close — `isPresented→false` triggers native dismiss animation, then `onIsPresentedChange` fires to unmount. When `fitToContents` is active, `presentationDetents` modifier is skipped so native `fitToContents` measures content height.

- **Android**: Wraps `jetpack-compose/ModalBottomSheet` + `RNHostView`. Native module exposes `hide()`, `expand()`, `partialExpand()` on `ModalBottomSheetView`. Only 2 snap states: partial (~50%) and expanded. `snapToIndex(0)` calls `partialExpand()`, `snapToIndex(lastIndex)` calls `expand()`. Uses `isOpenRef` to avoid stale closures in the stable `methods` object.

- **Web**: Uses [vaul](https://github.com/emilkowalski/vaul) (Radix Dialog-based drawer). Controlled via `open` prop — always mounted, vaul handles open/close animation. Snap point heights controlled via CSS `height` + `transition` on the content div (vaul's own snap system doesn't work well with controlled `open`). `fitToContents` always true on web — `BottomSheetView` strips `flex` styles so vaul measures content naturally.

### Native bridge pattern

Each native platform follows: `Host matchContents` → native sheet → `RNHostView` → `View` → children.
- `Host`: bridges React Native → native (SwiftUI/Compose)
- `RNHostView`: bridges native → React Native (embeds RN views inside native sheet)
- `matchContents`: when `fitToContents`, RNHostView reports natural content height instead of filling available space

### Callback refs pattern

All three platforms use `useRef` for `onChange`/`onClose`/`onDismiss` callbacks to keep `useMemo`/`useCallback` closures stable. Without this, parent re-renders (from callback invocations) would recreate the `methods` object, destabilizing context consumers and causing native view re-renders. The `fireCloseCallbacks` helper deduplicates close logic.

## BottomSheet vs BottomSheetModal

`BottomSheet` defaults `index={0}` (open on mount). `BottomSheetModal` is a wrapper in `index.tsx` that forces `index={-1}` (closed) and overrides `present()` to open at the target snap index. Both share the same platform component underneath.

TypeScript declaration merging (`const BottomSheet` + `type BottomSheet`) allows `useRef<BottomSheet>` and `useRef<BottomSheetModal>` to resolve to `BottomSheetMethods` without a separate type import.

## BottomSheetView flex stripping

When `fitToContents` is active (no snap points), `BottomSheetView` strips `flex`/`flexGrow`/`flexShrink`/`flexBasis` from its style via `BottomSheetInternalContext`. This is needed because gorhom examples always use `<BottomSheetView style={{ flex: 1 }}>`, but `flex: 1` reports zero intrinsic height — breaking native `fitToContents` measurement which needs the content's natural height.

## What's NOT supported

- `BottomSheetBackdrop`, `BottomSheetHandle`, `BottomSheetFooter` (not exported — native/vaul handles these)
- `animatedIndex` / `animatedPosition` shared values
- Custom handle/backdrop/background component rendering (only show/hide control)
- `BottomSheetVirtualizedList`, `BottomSheetFlashList`, `BottomSheetDraggableView`
- Combining `enableDynamicSizing` with explicit `snapPoints` (native iOS `fitToContents` and `presentationDetents` are mutually exclusive)

## TSDoc convention

Every prop that differs from `@gorhom/bottom-sheet` behavior has a `@remarks` tag. No-op props include: "This prop is accepted for API compatibility but has no effect."
