---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptValue` methods that convert tuples, and the arrays, optionals and dictionaries that hold them, for the code that `expo-modules-macros` generates: `decodeTuple`, `encodeTuple`, `decodeArray`, `encodeArray`, `decodeOptional`, `encodeOptional`, `decodeDictionary` and `encodeDictionary`. An unlabeled tuple converts to an array, and a labeled tuple to an object. The encode methods write into a `JavaScriptValue.Slot`. Also add `JavaScriptObject.setProperty(_:encodingWith:)` and `JavaScriptValuesBuffer.emplace(at:encodingWith:)`, which encode a value straight into a slot of the property or the argument, `JavaScriptValue.encoding(in:_:)`, which creates a value from what is written into a slot, and `JavaScriptCallback.invokeBlocking(_:argumentCount:decoding:emplacing:)`, which decodes the result of a JavaScript function with a closure.
