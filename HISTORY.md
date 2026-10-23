# History

## 2026-10-23 10:46 — Spike SwiftUI SplitView with Expo Router

**Asked:** Test whether Expo Router content can run inside `@expo/ui`
`NavigationSplitView` columns, including per-column headers, without a first-render
layout shift.

**Did / why:** Added a router-tester-only probe instead of changing the public
`SplitView` API before the integration risk was known. A fresh simulator development
build passed on iPad and iPhone; the recordings and frame timelines are stored in
[`apps/router-tester/artifacts/eng-28595`](./apps/router-tester/artifacts/eng-28595/REPORT.md).
