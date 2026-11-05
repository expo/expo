# Stack in SplitView — TODO

Issues found on the iPhone Duo simulator with `apps/router-tester`, demo `split-view-navigation`.

## 1. Content under the Stack header with automatic inset adjustment

**Steps:** Open `router-tester://split-view-navigation/settings` by deep link while the app shows another route.

**Observed:** One time, the `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` got no top inset. The links showed under the "Settings" title. Two screenshots a few seconds apart showed the same layout. Later runs showed the content below the header.

**Expected:** The content always starts below the Stack header.

![Settings links drawn under the Stack header title](screenshots/split-stack-todo/content-under-header.png)

**Next step:** Find reliable steps to reproduce. Then check which navigation bar the scroll view uses for its inset while the split column bar is hidden.

## Known limitations

### Large title of the Stack root shows inline in the shared bar

**Steps:** Collapsed layout. Set `headerLargeTitle: true` on the Settings root.

**Observed:** The shared split bar shows the title inline. Its large title and its scroll edge appearance follow the content scroll view that UIKit finds for the content column, not the `ScrollView` of the Stack root. Linking that `ScrollView` with `setContentScrollView` showed the large title at rest, but the title disappeared after a pop back to the root, so the link was not kept.

**Next step:** Find which scroll view state the shared bar needs after the header returns from the Stack.

### A sheet over the resting root swaps the header under the sheet

**Steps:** Collapsed layout. Open Settings, then open a `modal` or `formSheet` route of the Stack.

**Observed:** The root loses focus, so its header moves back from the shared bar to the Stack while the sheet animates in. Both bars show the same item, so the swap is not visible in the recordings, but it is a header change under the sheet.

**Next step:** Keep the root in the shared bar while a sheet covers it, if a later case shows a visible change.

### A hidden column header shows after a pop to that column

**Steps:** Collapsed layout, no Stack. Set `header.hidden` on the Entries column. Open an entry and go back.

**Observed:** Entries shows its title and Back after the pop. This happens without a nested Stack as well.

**Next step:** Apply the hidden state of each column to the shared bar when the column becomes the top of the collapsed navigation.

### Other notes

- The expanded sidebar button rule for `.twoDisplaceSecondary` is not verified on a device. The iPad Pro 13-inch never entered that display mode.
