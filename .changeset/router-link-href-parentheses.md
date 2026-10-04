---
'expo-router': patch
---

Fixed `<Link>` dropping the search params, hash, or part of an external URL from its `href` when they contain parentheses.
