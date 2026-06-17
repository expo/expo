// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// Every `Record` is `JavaScriptCodable`. The conversion is a thin wrapper over the record's own
// `from(object:)` / `toObject(appContext:)` surface — which the `@Record` macro synthesizes as flat,
// reflection-free, per-property reads and writes. So a record decode is N concrete property
// conversions with no `Mirror` and no per-value `Any` box.
//
// Records only implement the owning `decode` overload (the requirement). They walk an object's
// properties regardless, so the zero-copy `JavaScriptUnownedValue` fast path offers nothing here;
// the defaulted overload materializes an owning value and forwards.

extension Record {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Self {
    return try from(object: value.asObject(), appContext: appContext)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Self, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try value.toObject(appContext: appContext).asValue()
  }
}
