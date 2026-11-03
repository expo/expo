# Stack in SplitView — TODO

Issues found on the iPhone Duo simulator with `apps/router-tester`, demo `split-view-navigation`.

## 1. Interactive swipe back from the Stack root overlaps two headers

**Steps:** Collapsed layout. Open Settings (nested Stack root). Swipe back slowly to the previous column.

**Observed:** The Stack header title ("Settings") and the previous column header title draw on top of each other during the swipe. The rail Back button stays in place and does not follow the transition.

**Expected:** One header moves with each screen, as in a plain `UINavigationController` pop. The rail button changes with the transition to the previous column state.

**Where to look:** The root gesture is moved to the primary navigation controller in `SplitViewStackScreenView.updateRootGesture` (`packages/expo-router/ios/SplitView/SplitViewColumnView.swift`). The split column bar stays hidden while the Stack owns the header, so the transition animates two separate bars.

## 2. Rail shows the sidebar button in the expanded layout

**Steps:** Expanded layout (`twoBesideSecondary`). Open Settings (nested Stack root).

**Observed:** The rail shows the split view display-mode (sidebar) button. In the collapsed layout the rail shows Back, which is correct.

**Expected:** Not decided. Confirm the native behavior first.

**Next step:** In the expanded layout, open a content screen without a nested Stack (`router-tester://split-view-navigation/all/GitHub`). If the rail also shows the sidebar button, this is UIKit behavior. If not, the Stack header ownership causes it. The spike removes its `backAction` when expanded (`installControls`) and hides the split column bar. No Expo or Screens code sets rail items.

## 3. Content under the Stack header with automatic inset adjustment

**Steps:** Open `router-tester://split-view-navigation/settings` by deep link while the app shows another route.

**Observed:** One time, the `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` got no top inset. The links showed under the "Settings" title. Two screenshots a few seconds apart showed the same layout. Later runs showed the content below the header.

**Expected:** The content always starts below the Stack header.

**Next step:** Find reliable steps to reproduce. Then check which navigation bar the scroll view uses for its inset while the split column bar is hidden.
