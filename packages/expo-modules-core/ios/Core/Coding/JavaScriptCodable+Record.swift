// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// Every `Record` is `JavaScriptCodable`. The conversion is a thin wrapper over the record's own
// `from(object:appContext:)` / `toObject(appContext:)` surface — which the `@Record` macro
// synthesizes as flat, reflection-free, per-property reads and writes. So a record decode is N
// concrete property conversions with no `Mirror` and no per-value `Any` box.
//
// Unlike the other conformances, the record surface still routes per-property conversion through
// the legacy `AnyDynamicType` converters, which need the app context. `JavaScriptCodable` no
// longer threads it through, so the witnesses recover it from the runtime via
// `AppContext.from(runtime:)` (a lookup of the `global.expo` native state). A runtime the app
// context never prepared has no such state, so recovery returns `nil` and the conversion throws
// `Exceptions.AppContextNotFound`.
//
// Records only implement the owning `decode` overload (the requirement). They walk an object's
// properties regardless, so the zero-copy `JavaScriptUnownedValue` fast path offers nothing here;
// the defaulted overload materializes an owning value and forwards.

extension Record {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self
  {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    return try from(object: value.asObject(), appContext: appContext)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Self, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    return try value.toObject(appContext: appContext).asValue()
  }
}
