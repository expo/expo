---
'expo-router': patch
---

Fix the first visit to a lazy tab skipping its enter animation. The tab's placeholder route is replaced by the real route under a new key, whose animated value started at the focused position, so `animation: 'fade'` and `'shift'` had nothing to animate. A route that is new and focused at once now starts beside the previously focused route.
