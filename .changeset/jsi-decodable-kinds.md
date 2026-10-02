---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] Add `decodableKinds` to `JavaScriptDecodable`: the kinds of JavaScript value (`JavaScriptValueKinds`) that `decode` can accept, so code that picks between several types can skip the ones that can't match.
