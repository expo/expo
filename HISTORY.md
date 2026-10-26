## 2026-10-26 09:50 — Isolate the toolbar without Stack
**Asked:** Check whether rendering the expo-ui toolbar directly in the split-view detail, without Stack, still leaves a gap.
**Did / why:** Replaced the detail temporarily with pure SwiftUI `Toolbar` and content, rebuilt Expo Router, and verified it on EAS Simulator. It rendered one navigation bar aligned with the other columns and no gap, confirming the extra region is introduced only when the React Navigation Stack is embedded. Reverted the temporary implementation and retained the screenshot and conclusion in the scope report.

## 2026-10-26 09:45 — Test the pure-SwiftUI toolbar structure around Stack
**Asked:** Render `Stack.Toolbar` directly in the split view's expo-ui toolbar while keeping the UIKit Stack header hidden.
**Did / why:** Moved the navigation modifiers to a SwiftUI `VStack` around `RNHostView`, matching the working pure-SwiftUI example's structure, and verified it on EAS Simulator. The gap remained and accessibility still exposed two navigation bars, proving the embedded native Stack is the remaining navigation-host boundary. Reverted the ineffective code change and retained the screenshot and finding in the scope report.

## 2026-10-26 09:35 — Render the detail header with expo-ui
**Asked:** Keep the detail as a Stack navigator but use the expo-ui toolbar for its visible header so the Mail toolbar aligns with the other split-view headers and has no gap.
**Did / why:** Added a JavaScript adapter that forwards the focused route's `Stack.Title` and top `Stack.Toolbar.Button` declarations to the `@expo/ui` toolbar while hiding the Stack's native header. Follow-up EAS inspection showed that the embedded Stack still creates a second navigation-host region, so the adapter renders the controls but does not eliminate the gap.

## 2026-10-26 08:45 — Keep two Mail columns visible
**Asked:** Use a three-column Mail layout where the system control only hides or shows the sidebar, leaving at least the message list and detail visible.
**Did / why:** Set the demo to prefer all three columns and supplied bounded sidebar and message-list widths so the iPad can preserve the content/detail pair when the sidebar collapses. Verified both the three-column and sidebar-hidden two-column states on EAS Simulator and stored screenshots in `apps/router-tester/artifacts/eng-28595/media/`.

## 2026-10-26 08:32 — Remove the detail header gap
**Asked:** Fix the Mail reproduction because the Google Photos navigation header appeared too low with an empty gap above it.
**Did / why:** Removed the nested `SafeAreaProvider` around the detail Stack to eliminate one redundant inset boundary. EAS verification later showed that this did not remove the full gap: SwiftUI still reserves its own navigation-bar region above the nested UIKit Stack header, which remains an open limitation of the no-native-code adapter.

## 2026-10-26 08:20 — Spike Expo Router split view on expo-ui
**Asked:** Scope ENG-28595 by replacing the React Native Screens split-view renderer with an adapter-selectable `@expo/ui` `NavigationSplitView`, making the detail navigator a Stack, and reproducing the Apple Mail toolbar in router-tester on EAS Simulator.
**Did / why:** Added separate RNS and expo-ui adapters behind a per-instance prop so implementations do not leak across mounted split views. Kept route headers and toolbar items in the detail Stack because the existing `Stack.Toolbar` API provides the required Mail-style controls without native changes. Recorded unsupported mappings and EAS iPad evidence in `apps/router-tester/artifacts/eng-28595/`.
