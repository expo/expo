---
'@expo/ui': patch
---

Add a `modifiers` prop to the community `BottomSheet`. On iOS they are applied to the sheet's content after the component's own, so a sheet can clear a safe-area inset the window has, for example the side rail of a folded iPhone Duo, with `ignoreSafeArea({ edges: 'horizontal' })`. On Android they are applied to the `ModalBottomSheet`.
