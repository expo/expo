---
'expo-modules-core': patch
---

[iOS] Keep the event listeners of a shared object in each runtime. A release of a shared object in a worklet runtime now also removes its listeners in the main runtime. Native events of a shared object with listeners in more than one runtime are about 22% faster.
