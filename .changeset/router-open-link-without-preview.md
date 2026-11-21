---
'expo-router': patch
---

[iOS] Open the link when you tap a `Link` that has a `Link.Menu` but no `Link.Preview`, as iOS lifts the link itself above its menu. Before, the tap only closed the menu.
