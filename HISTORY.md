## 2026-10-26 11:01 — Consolidate the split-view spike around Mail
**Asked:** Keep `/split-view-mail` as the spike's only dedicated demo, remove the toolbar-isolation route and old ENG-28595 PNGs, and prepare the report for fresh screenshots.
**Did / why:** Removed the reduced repro because its toolbar stayed aligned and it did not reproduce the Mail offset. Replaced all old ENG-28595 images with three fresh EAS iPad screenshots of the Mail-only demo: the initial three-column layout, the selected-message state, and the sidebar-hidden two-column layout. In the selected-message state, the accessibility tree contains the title and toolbar buttons, but their visible title and symbols are missing or blank and the content starts below extra space. Sidebar hiding correctly leaves two columns visible.

## 2026-10-26 10:37 — Reduce the split-view toolbar issue
**Asked:** Create a minimal reproduction of incorrect toolbar positioning for a hidden-header Router Stack hosted under `NavigationSplitView.Detail → Toolbar → VStack → RNHostView`.
**Did / why:** Added a dedicated two-screen router-tester route and reduced the columns and content to labels. A fresh EAS iPad run showed that the exact direct hierarchy stays aligned, and the adapter reduction also keeps its toolbar level after a push, although its registered title disappears. Kept the reduction and screenshot because they disprove the host hierarchy as a sufficient cause and narrow the remaining issue to additional adapter or Mail-demo state.

## 2026-10-26 09:50 — Isolate the toolbar without Stack
**Asked:** Check whether rendering the expo-ui toolbar directly in the split-view detail, without Stack, still leaves a gap.
**Did / why:** Replaced the detail temporarily with pure SwiftUI `Toolbar` and content, rebuilt Expo Router, and verified it on EAS Simulator. It rendered one navigation bar aligned with the other columns and no gap. A later nested-Stack reduction also stayed aligned, so this control rules out the pure SwiftUI toolbar but does not identify the exact Mail trigger.

## 2026-10-26 09:45 — Test the pure-SwiftUI toolbar structure around Stack
**Asked:** Render `Stack.Toolbar` directly in the split view's expo-ui toolbar while keeping the UIKit Stack header hidden.
**Did / why:** Moved the navigation modifiers to a SwiftUI `VStack` around `RNHostView`, matching the working pure-SwiftUI example's structure, and verified it on EAS Simulator. The Mail run retained the gap and exposed two navigation bars. A later minimal run of the same hierarchy stayed aligned, so the exact trigger remains unresolved.

## 2026-10-26 09:35 — Render the detail header with expo-ui
**Asked:** Keep the detail as a Stack navigator but use the expo-ui toolbar for its visible header so the Mail toolbar aligns with the other split-view headers and has no gap.
**Did / why:** Added a JavaScript adapter that forwards the focused route's `Stack.Title` and top `Stack.Toolbar.Button` declarations to the `@expo/ui` toolbar while hiding the Stack's native header. The Mail run retained an empty row, but a later minimal nested-Stack run stayed aligned, so the trigger remains unresolved.

## 2026-10-26 08:45 — Keep two Mail columns visible
**Asked:** Use a three-column Mail layout where the system control only hides or shows the sidebar, leaving at least the message list and detail visible.
**Did / why:** Set the demo to prefer all three columns and supplied bounded sidebar and message-list widths so the iPad can preserve the content/detail pair when the sidebar collapses. Verified both the three-column and sidebar-hidden two-column states on EAS Simulator and stored screenshots in `apps/router-tester/artifacts/eng-28595/media/`.

## 2026-10-26 08:32 — Remove the detail header gap
**Asked:** Fix the Mail reproduction because the Google Photos navigation header appeared too low with an empty gap above it.
**Did / why:** Removed the nested `SafeAreaProvider` around the detail Stack to eliminate one redundant inset boundary. The Mail run still showed the gap afterward, but a later minimal nested-Stack run stayed aligned, so this ruled out the provider without establishing the remaining cause.

## 2026-10-26 08:20 — Spike Expo Router split view on expo-ui
**Asked:** Scope ENG-28595 by replacing the React Native Screens split-view renderer with an adapter-selectable `@expo/ui` `NavigationSplitView`, making the detail navigator a Stack, and reproducing the Apple Mail toolbar in router-tester on EAS Simulator.
**Did / why:** Added separate RNS and expo-ui adapters behind a per-instance prop so implementations do not leak across mounted split views. Kept route headers and toolbar items in the detail Stack because the existing `Stack.Toolbar` API provides the required Mail-style controls without native changes. Recorded unsupported mappings and EAS iPad evidence in `apps/router-tester/artifacts/eng-28595/`.
