---
"expo-linking": patch
---

Stop decoding query parameter values twice in `parse()`. Values with percent-encoded `%`, `+` or `@` were altered, and malformed percent-encoding threw a `URIError`.

See: [#50289](https://github.com/expo/expo/pull/50289)
