// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// Binds native types into the JavaScript runtime: creates their JavaScript classes and objects,
/// installs them and registers them in the app context.
internal enum JavaScriptBindings {
  // MARK: - Shared objects

  /// Builds the JavaScript class of a `@SharedObject` class that a module registers in `_classTypes`,
  /// and registers its prototype for the class in `ClassRegistry`. All members come from the macro
  /// hooks, so no `ClassDefinition` is needed.
  @JavaScriptActor
  static func buildSharedObjectClass(_ type: any AnySharedObject.Type, appContext: AppContext) throws -> JavaScriptObject {
    let name = type._jsName
    let constructor: JavaScriptRuntime.SyncFunctionClosure = { [weak appContext] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      // Pair the native instance with `this` (returning a different object would drop the prototype
      // chain `new` set up). Without a `@JS init`, only the native side can create an instance.
      guard let sharedObject = try type._constructSharedObject(this: this, arguments: arguments, in: appContext.runtime) else {
        throw Exceptions.ConstructorUnavailable(name)
      }
      appContext.sharedObjectRegistry.add(native: sharedObject, javaScript: this.getObject(), inheritsBaseClass: true)
      return this
    }
    let runtime = try appContext.runtime
    let klass = try createSharedObjectClass(type, name: name, appContext: appContext, constructor).asObject()
    let prototype = klass.getProperty("prototype").getObject()

    if type.bindsOwnJSMembers {
      try type._decorateSharedObject(prototype: prototype, in: runtime)
      try type._decorateSharedObject(constructor: klass, in: runtime)
    }

    appContext.classRegistry.register(nativeClassId: ObjectIdentifier(type), prototype: prototype)
    return klass
  }

  /// Creates the JavaScript class of a shared object class, without its members. The class extends the JavaScript
  /// class of `resolvedJSParentClassType`, which is built first when it isn't built yet, or the base `SharedObject` or
  /// `SharedRef` class.
  @JavaScriptActor
  static func createSharedObjectClass(
    _ type: any AnySharedObject.Type,
    name: String,
    appContext: AppContext,
    _ constructor: @escaping JavaScriptRuntime.SyncFunctionClosure
  ) throws -> JavaScriptFunction {
    let runtime = try appContext.runtime
    if let parentType = type.resolvedJSParentClassType {
      let parentClass = try appContext.getSharedObjectClass(parentType).getFunction()
      return try runtime.createClass(name: name, inheriting: parentClass, constructor)
    }
    if type is AnySharedRef.Type {
      return try runtime.createSharedRefClass(name, constructor)
    }
    return try runtime.createSharedObjectClass(name, constructor)
  }

  /// Builds a prototype for a `@SharedObject` class in an alternate runtime (e.g. the worklet runtime),
  /// inheriting from the given prototype: the prototype of the parent class in that runtime, or the base prototype.
  /// The counterpart of `ClassDefinition.buildPrototype` for the classes that a module registers in `_classTypes`.
  @JavaScriptActor
  static func buildSharedObjectPrototype(
    _ type: any AnySharedObject.Type,
    in runtime: JavaScriptRuntime,
    basePrototype: consuming JavaScriptObject
  ) throws -> JavaScriptObject {
    let prototype = runtime.createObject(prototype: basePrototype)
    if type.bindsOwnJSMembers {
      try type._decorateSharedObject(prototype: prototype, in: runtime)
    }
    return prototype
  }
}
