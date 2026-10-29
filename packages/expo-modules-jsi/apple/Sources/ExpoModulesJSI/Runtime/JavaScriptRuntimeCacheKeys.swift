// Copyright 2026-present 650 Industries. All rights reserved.

extension JavaScriptRuntime {
  /// Keys of all values that the package caches in each runtime. Each value is created on first use in a
  /// runtime and reused until the runtime is torn down.
  ///
  /// A cached global keeps the value it had on first use, so cache only values that JavaScript code is not
  /// expected to replace. For example, don't cache a global that a polyfill may install or swap, such as
  /// `Promise`.
  internal struct CacheKeys {
    // MARK: - Global functions

    /// The global `BigInt` function.
    static let bigInt = Cache.Key<JavaScriptFunction.Ref>()

    /// The global `Date` constructor and the `Date` functions that the conversions call.
    static let date = Cache.Key<DateFunctions>()

    /// `Reflect.defineProperty` and the property names of a descriptor.
    static let reflectDefineProperty = Cache.Key<DefinePropertyFunction>()

    /// The global `Set` constructor.
    static let setConstructor = Cache.Key<JavaScriptFunction.Ref>()

    /// The global `Uint8Array` constructor.
    static let uint8ArrayConstructor = Cache.Key<JavaScriptFunction.Ref>()

    // MARK: - Functions evaluated from source

    /// The factory of the classes created with `createClass`.
    static let classFactory = Cache.Key<JavaScriptFunction.Ref>()

    /// The `() => [promise, resolve, reject]` function.
    static let deferredPromiseFactory = Cache.Key<JavaScriptFunction.Ref>()

    /// The function that copies the entries of a JS `Set` into an array.
    static let setEntries = Cache.Key<JavaScriptFunction.Ref>()

    // MARK: - Property names

    /// The property names that a typed array is read through.
    static let typedArrayPropNames = Cache.Key<JavaScriptTypedArray.PropNames>()
  }
}
