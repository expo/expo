---
'@expo/cli': patch
---

Cache the resolved manifest runtime version per platform for the dev-server session, instead of recomputing it (including a full `@expo/fingerprint` computation under `runtimeVersion: { policy: 'fingerprint' }`) on every manifest request, which could take longer than a dev client's connection timeout and surface as "failed to connect".
