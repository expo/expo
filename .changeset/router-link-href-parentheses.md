---
'expo-router': patch
---

Prevent `<Link>` from dropping the search params, hash, or part of an external URL from its `href` when they contain parentheses.
