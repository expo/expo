// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal final class ClassRegistry {
  // Prototypes are kept behind `JavaScriptRef` because `JavaScriptObject` is ~Copyable and cannot be a
  // Dictionary value. Only the prototype is kept: creating an instance needs nothing else from the class,
  // and reading the prototype from the class would cost a property lookup on every instance.
  var nativeToPrototype = [ObjectIdentifier: JavaScriptObject.Ref]()

  // MARK: - Accessing

  /// Calls `body` with the prototype of the JavaScript class registered for the native class.
  /// Returns `nil` when no class is registered.
  func withPrototype<R: ~Copyable>(
    nativeClassId: ObjectIdentifier,
    _ body: (borrowing JavaScriptObject) throws -> R
  ) rethrows -> R? {
    return try nativeToPrototype[nativeClassId]?.withUnwrappedValue(body)
  }

  // MARK: - Registration

  func register(nativeClassId: ObjectIdentifier, prototype: consuming JavaScriptObject) {
    nativeToPrototype[nativeClassId] = prototype.ref()
  }

  internal func clear() {
    nativeToPrototype.removeAll()
  }
}
