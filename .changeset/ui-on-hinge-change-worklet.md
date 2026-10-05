---
'@expo/ui': patch
---

[iOS] `onHingeChange` also accepts a callback from `useWorkletCallback`, which runs on the UI thread to track the hinge angle without a JS-thread round trip.
