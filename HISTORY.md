# History

## 2026-11-02 18:18 UTC — Publish the Stack in SplitView spike branch
**Asked:** Implement and test nested Stack integration above PR #52506, prefer Expo coordination with minimal Screens changes, then push the branch for the next implementer.
**Did / why:** Added native header ownership, compact column spacing, root Back and gesture coordination while retaining separate navigation histories. Screens only preserves its prior header visibility during refresh. This is a prototype for [ENG-28808](https://linear.app/expo/issue/ENG-28808/router-integrate-stack-with-splitview), based on `a1e277ee5a2c52f730e9ca35543a3e78aa459f66`, not a production-ready change. The ticket contains the attached spike reports and implementation guidance.

The unchanged implementation passed 50 native tests in 13 suites, 214 focused JavaScript tests, and Router package checks. Native tests require Gamma-enabled Screens Pods. Duo validation covers root and pushed swipe completion/cancellation, state retention, disabled gestures, full-screen modal return and three-column Back. Header ownership was also tested on iPad. The [Duo screenshot](screenshots/split-stack-spike/duo-root.png) records the tested native build before this commit; test resources have been stopped.

Remaining coverage: older-iOS gestures, arbitrary iPad window geometry, Inspector with Stack, visible status-bar/orientation behavior, and another root swipe after the final refold. Router-tester still has three pre-existing `/404` typed-route errors. The branch includes the demo and read-only native probe so these checks can be repeated.
