---
'expo-router': patch
---

Add the `backBehaviorInitialRoute` prop to tabs, native tabs, drawer, top tabs, and headless tabs to set the route that `backBehavior: 'initialRoute'` goes back to, and warn when `backBehavior: 'initialRoute'` is set without it.
