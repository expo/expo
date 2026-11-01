---
'expo-router': patch
---

Fixes a development-only "A component was suspended by an uncached promise" warning when `useLoaderData` reads data that settled during a suspended render.
