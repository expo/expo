---
'@expo/cli': patch
---

Fix `CorsMiddleware`'s local-hostname check to require a literal dot between IPv4 octets, instead of an unescaped regex wildcard that let non-loopback hostnames starting with `127` (e.g. `127a1b1c1`) bypass the dev server's cross-origin request guard.
