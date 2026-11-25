---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptObject.defineLazyProperty(_:options:factory:)`, which defines a property whose value is created on the first read. That read replaces the property with a data property that holds the value. The factory gets the object that the property is read from (`this`), so a property on a prototype creates a value for each object that inherits it. `defineLazyProperty(symbol:options:factory:)` defines the property under a `JavaScriptSymbol.Shared` symbol: a well-known symbol (`.wellKnown(.iterator)`) or a symbol from the global symbol registry (`.for("app.id")`, or the string literal `"app.id"`). `JavaScriptSymbol(runtime, symbol)` returns that symbol.
