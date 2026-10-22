---
'expo-router': patch
---

[iOS] Make `NativeTabs.Trigger` with `role="search"` a native search tab (`UISearchTab`) on iOS 26.1 and later. Selecting this tab now focuses the header search bar of its nested stack and opens the keyboard. Set `disableAutomaticSearchActivation` to leave the search field inactive.
