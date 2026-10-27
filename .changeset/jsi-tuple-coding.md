---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptValue` methods that convert tuples, and the arrays, optionals and dictionaries that hold them, for the code that `expo-modules-macros` generates: `decodeTuple`, `encodeTuple`, `decodeArray`, `encodeArray`, `decodeOptional`, `encodeOptional`, `decodeDictionary` and `encodeDictionary`. An unlabeled tuple converts to an array, and a labeled tuple to an object. Also add `JavaScriptCallback.invokeBlocking(_:argumentCount:decoding:emplacing:)`, which decodes the result of a JavaScript function with a closure.
