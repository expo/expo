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
// `decode` reads the object straight from the borrowed value and hands it to
// `from(object:appContext:)`, so a record argument isn't copied first. An owning value takes the
// `JavaScriptDecodable` default, which borrows it and calls this `decode`.

extension Record {
  // A record decodes only from an object.
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Self
  {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    return try from(object: value.asObject(in: runtime), appContext: appContext)
  }

  /// Used only by records without the `@Record` macro, for example records with `@Field` properties. The macro gives
  /// each record its own `encode(_:in:)`, which uses the runtime it gets.
  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Self, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    // `toObject(appContext:)` creates the object in the main runtime. In another runtime, for example the worklet UI
    // runtime, it would use the main runtime from the thread of that runtime.
    guard runtime.id == (try appContext.runtime).id else {
      throw RecordInAnotherRuntimeException(String(describing: Self.self))
    }
    return try value.toObject(appContext: appContext).asValue()
  }
}

@usableFromInline
internal final class RecordInAnotherRuntimeException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot convert the record '\(param)' in a JavaScript runtime other than the main runtime, for example the worklet UI runtime. A record that the `@Record` macro doesn't convert creates its object in the main runtime. Use the `@Record` macro on a struct instead: its records convert in any runtime"
  }
}
