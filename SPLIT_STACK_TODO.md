# Stack in SplitView — TODO

Issues found on the iPhone Duo simulator with `apps/router-tester`, demo `split-view-navigation`.

## 1. Content under the Stack header with automatic inset adjustment

**Steps:** Open `router-tester://split-view-navigation/settings` by deep link while the app shows another route.

**Observed:** One time, the `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` got no top inset. The links showed under the "Settings" title. Two screenshots a few seconds apart showed the same layout. Later runs showed the content below the header.

**Expected:** The content always starts below the Stack header.

![Settings links drawn under the Stack header title](screenshots/split-stack-todo/content-under-header.png)

**Next step:** Find reliable steps to reproduce. Then check which navigation bar the scroll view uses for its inset while the split column bar is hidden.

## Known limitations

### Stack root header items hide during the root pop

**Steps:** Collapsed layout. Add `headerRight` to the Settings root (`apps/router-tester/app/split-view-navigation/settings/index.tsx`). Open Settings and swipe back slowly, or tap Back.

**Observed:** The shared split bar shows only the Stack root title and Back. `headerRight` and `headerLeft` items, a search bar and a custom `headerTitle` are hidden from the gesture start until the pop ends or is cancelled. The shared bar copies the large title display mode of the Stack root, but a large title root was not checked on a device.

**Next step:** Mirror the items through an API that Screens supports, or get approval for a Screens change.

The bar is prepared in `gestureRecognizerShouldBegin`, because UIKit starts the pop from its own gesture target before any target Expo could add. If UIKit then starts no transition, the column is restored in the same run loop turn. A one-frame flicker in that case is not expected but was not measured.

### Other root pops still fade

Root pops that start from JavaScript, for example `router.back()` or `show('primary')`, reach UIKit without the Expo preparation. They still use the fallback that hides the shared bar and fades in the previous column header. This path was not tested on a device.

The expanded sidebar button rule for `.twoDisplaceSecondary` is not verified on a device. The iPad Pro 13-inch never entered that display mode.
