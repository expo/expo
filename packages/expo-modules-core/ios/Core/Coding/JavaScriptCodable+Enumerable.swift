// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// Every `Enumerable` is `JavaScriptCodable`: an enum converts as its raw value. The witnesses are
// provided for `RawRepresentable` enums whose `RawValue` is itself `JavaScriptCodable` (in practice
// `String` or an integer type), delegating the actual conversion to that raw value's conformance.

extension Enumerable where Self: RawRepresentable, RawValue: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Self {
    let rawValue = try RawValue.decode(value, appContext: appContext, runtime: runtime)
    return try create(fromRawValue: rawValue)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Self, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try RawValue.encode(value.rawValue, appContext: appContext, runtime: runtime)
  }
}
