// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

extension SharedObject {
  /// Installs `expo.SharedObject`, the base class of shared objects, on the core object, `global.expo`, and returns
  /// it. The class extends `expo.EventEmitter`. Its prototype has `release`, `toJSON`, a `Symbol.toStringTag` getter
  /// and a `__expo_shared_object_id__` getter.
  ///
  /// `release` and the ID getter are host functions, because they read the native state. `toJSON` and the
  /// `Symbol.toStringTag` getter are JS functions: they read properties of `this`, a getter can throw, and a C++
  /// exception can't cross into Swift.
  @JavaScriptActor
  internal static func installBaseClass(
    on coreObject: borrowing JavaScriptObject,
    inheriting eventEmitterClass: consuming JavaScriptFunction,
    in runtime: JavaScriptRuntime,
    releaser: @escaping @Sendable (SharedObjectId) -> Void
  ) throws -> JavaScriptFunction {
    let sharedObjectClass = try runtime.createClass(name: "SharedObject", inheriting: eventEmitterClass) { this, _ in
      return this
    }
    let prototype = try sharedObjectClass.asObject().getPropertyAsObject("prototype")

    let release = runtime.createFunction("release") {
      (
        this: borrowing JavaScriptUnownedValue,
        _: consuming JavaScriptValuesBuffer,
        _: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      let object = try this.asObject(in: runtime)
      guard let nativeState = object.getNativeState(as: SharedObjectNativeState.self) else {
        return
      }
      releaser(nativeState.objectId)
      // Unsetting the native state does nothing when the object is frozen, for example a shared object passed as a
      // view prop, which React Native deep-freezes in development. The native object is already released, so the
      // native state can stay.
      object.unsetNativeState()
    }
    prototype.setProperty("release", value: release.takeValue())

    // This property should be deprecated, but it's still used when passing as a view prop.
    let getObjectId = runtime.createFunction("get") {
      (
        this: borrowing JavaScriptUnownedValue,
        _: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      let nativeState = try this.asObject(in: runtime).getNativeState(as: SharedObjectNativeState.self)
      result.emplace(number: Double(nativeState?.objectId ?? 0))
    }
    let objectIdDescriptor = runtime.createObject()
    objectIdDescriptor.setProperty("get", value: getObjectId.takeValue())
    prototype.defineProperty(sharedObjectIdPropertyName, descriptor: objectIdDescriptor)

    let defineJSMembers = try runtime.eval(label: "expo-modules-core/shared-object-members.js", jsMembersSource)
      .asFunction()
    let arguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
    arguments.emplace(prototype.asValue(), at: 0)
    _ = try defineJSMembers.call(arguments: arguments)

    coreObject.setProperty("SharedObject", value: sharedObjectClass.asValue())
    return sharedObjectClass
  }
}

/// Defines `toJSON` and the `Symbol.toStringTag` getter on the prototype of `expo.SharedObject`.
private let jsMembersSource = """
  (function (prototype) {
    // A JSON serializer for shared objects, whose properties are on the prototype instead of the instance itself.
    // By default, `JSON.stringify` reads only the enumerable own properties.
    prototype.toJSON = function toJSON() {
      const json = {};
      for (const key in this) {
        const value = this[key];
        if (typeof value !== 'function') {
          json[key] = value;
        }
      }
      return json;
    };

    // React in development deep-compares props whose `Object.prototype.toString` is `[object Object]`. That reads
    // every property getter, and a getter throws when its shared object was released. The tag is the name of the
    // class of the object, so subclasses, also those defined in JS, report their own.
    Object.defineProperty(prototype, Symbol.toStringTag, {
      configurable: true,
      get: function () {
        const constructor = this.constructor;
        if ((typeof constructor === 'object' && constructor !== null) || typeof constructor === 'function') {
          const name = constructor.name;
          if (typeof name === 'string' && name !== '') {
            return name;
          }
        }
        return 'SharedObject';
      },
    });
  })
  """
