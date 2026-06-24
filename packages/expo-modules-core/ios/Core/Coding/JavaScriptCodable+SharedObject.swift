// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `SharedObject` is `JavaScriptCodable`. A shared object is represented in JS by the object the
// `SharedObjectRegistry` pairs with it, so the conversion wraps that pairing rather than encoding the
// object's structure like `Record`.

extension SharedObject: JavaScriptDecodable, JavaScriptEncodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self
  {
    // Reads the native object off the JS object's `SharedObjectNativeState` (no app context needed).
    // Throws `NotFoundException` for a foreign object and `TypeMismatchException` when the paired
    // object isn't `Self`.
    return try native(from: value.asObject(), as: Self.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Self
  {
    // Overrides the defaulted overload to stay zero-copy: `asObject(in:)` reads the object straight off
    // the borrowed value, skipping the owning `JavaScriptValue` the default would materialize before
    // discarding it. The argument-decode fast path the macro emits goes through here.
    return try native(from: value.asObject(in: runtime), as: Self.self)
  }

  @JavaScriptActor
  public static func encode(_ value: SharedObject, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    // Delegates to `DynamicSharedObjectType.castToJS`, which returns the already-paired JS object or
    // creates and registers a new one. That needs the registry on the app context, recovered from the
    // runtime; an unprepared runtime throws `Exceptions.AppContextNotFound`.
    //
    // TODO: creating the object isn't `encode`'s job. Once creation/pairing moves elsewhere, `encode`
    // would only read the native state, dropping the app-context lookup and becoming `@inlinable` too.
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    return try DynamicSharedObjectType(innerType: Self.self).castToJS(value, appContext: appContext)
  }
}
