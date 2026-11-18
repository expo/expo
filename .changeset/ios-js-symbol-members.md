---
'expo-modules-core': patch
'expo-modules-jsi': patch
'expo-modules-cli': patch
---

[iOS] Bind `@JS` functions and properties under a symbol with `@JS(symbol:)`: a well-known symbol such as `@JS(symbol: .iterator)`, or a registered one such as `@JS(symbol: "app.id")` for `Symbol.for("app.id")`. Add `JavaScriptObject.setProperty(_:function:)` and `defineProperty` overloads that take a `JavaScriptSymbol` key. `generate-types` types a `[Symbol.iterator]` or `[Symbol.asyncIterator]` method that returns a JavaScript value as `Iterator<unknown>` or `AsyncIterator<unknown>`.
