## 2026-10-26 08:32 — Remove the detail header gap
**Asked:** Fix the Mail reproduction because the Google Photos navigation header appeared too low with an empty gap above it.
**Did / why:** Removed the nested `SafeAreaProvider` around the detail Stack because SwiftUI already applies the split-view safe area at that hosting boundary. The duplicate provider inset the native Stack a second time. Added a regression test and replaced the EAS iPad toolbar screenshot after verifying the header sits directly below the status area.

## 2026-10-26 08:20 — Spike Expo Router split view on expo-ui
**Asked:** Scope ENG-28595 by replacing the React Native Screens split-view renderer with an adapter-selectable `@expo/ui` `NavigationSplitView`, making the detail navigator a Stack, and reproducing the Apple Mail toolbar in router-tester on EAS Simulator.
**Did / why:** Added separate RNS and expo-ui adapters behind a per-instance prop so implementations do not leak across mounted split views. Kept route headers and toolbar items in the detail Stack because the existing `Stack.Toolbar` API provides the required Mail-style controls without native changes. Recorded unsupported mappings and EAS iPad evidence in `apps/router-tester/artifacts/eng-28595/`.
