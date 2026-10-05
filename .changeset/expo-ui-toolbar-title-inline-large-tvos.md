---
'@expo/ui': patch
---

[iOS][tvOS] Fix the tvOS build failing to compile with `'inlineLarge' is unavailable in tvOS` when `@expo/ui` is linked. `ToolbarTitleDisplayMode.inlineLarge` is unavailable on tvOS, but the `inlineLarge` case of the `toolbarTitleDisplayMode` modifier was only gated behind an OS version check that listed `tvOS 18.0`, so it was compiled into the tvOS slice. It is now guarded by platform and returns `nil` on tvOS. The same check also required iOS 18.0 / macOS 15.0, so `inlineLarge` silently fell back to `automatic` on iOS 17 and macOS 14 even though it is available there; it now applies on those versions.
