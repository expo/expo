// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// Binds native types into the JavaScript runtime: creates their JavaScript classes and objects,
/// installs them and registers them in the app context.
internal enum JavaScriptBindings {
  // MARK: - Classes

  /// Builds the JavaScript class of a `@SharedObject` or `@JSClass` class that a module registers in `_classTypes`,
  /// and registers its prototype for the class in `ClassRegistry`. All members come from the macro
  /// hooks, so no `ClassDefinition` is needed.
  @JavaScriptActor
  static func buildClass(_ type: any AnyJavaScriptClass.Type, appContext: AppContext) throws -> JavaScriptObject {
    let name = type._jsName
    let constructor: JavaScriptRuntime.SyncFunctionClosure = { [weak appContext] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      let runtime = try appContext.runtime
      // Pair the native instance with `this` (returning a different object would drop the prototype
      // chain `new` set up). Without a `@JS init`, only the native side can create a shared object.
      guard let instance = try type._constructInstance(this: this, arguments: arguments, in: runtime) else {
        if type is AnySharedObject.Type {
          throw Exceptions.ConstructorUnavailable(name)
        }
        throw JavaScriptClassNativeState.ConstructorUnavailableException(name)
      }
      if let sharedObject = instance as? SharedObject {
        appContext.sharedObjectRegistry.add(native: sharedObject, javaScript: this.getObject(), inheritsBaseClass: true)
      } else {
        let object = try this.asObject()
        guard object.trySetNativeState(instance._makeNativeState(for: object, in: runtime)) else {
          throw JavaScriptClassNativeState.NotAttachableException(name)
        }
      }
      return this
    }
    let runtime = try appContext.runtime
    let klass = try createClass(type, name: name, appContext: appContext, constructor).asObject()
    let prototype = klass.getProperty("prototype").getObject()

    if type.bindsOwnJSMembers {
      try type._decorateClass(prototype: prototype, in: runtime)
      try type._decorateClass(constructor: klass, in: runtime)
    }

    appContext.classRegistry.register(nativeClassId: ObjectIdentifier(type), prototype: prototype)
    return klass
  }

  /// Creates the JavaScript class of a native class, without its members. The class extends the JavaScript class of
  /// `resolvedJSSuperclassType`, which is built first when it isn't built yet. Without that superclass, the class of a
  /// shared object extends the base `SharedObject` or `SharedRef` class, the class of a `BaseEventEmitter` subclass
  /// extends `expo.EventEmitter`, and the class of any other `@JSClass` class extends no class.
  @JavaScriptActor
  static func createClass(
    _ type: any AnyJavaScriptClass.Type,
    name: String,
    appContext: AppContext,
    _ constructor: @escaping JavaScriptRuntime.SyncFunctionClosure
  ) throws -> JavaScriptFunction {
    let runtime = try appContext.runtime
    if let superclassType = type.resolvedJSSuperclassType {
      let superclass = try appContext.getJavaScriptClass(superclassType).getFunction()
      return try runtime.createClass(name: name, inheriting: superclass, constructor)
    }
    if type is AnySharedRef.Type {
      return try runtime.createSharedRefClass(name, constructor)
    }
    if type is AnySharedObject.Type {
      return try runtime.createSharedObjectClass(name, constructor)
    }
    if type is BaseEventEmitter.Type {
      return try runtime.createClass(name: name, inheriting: runtime.getEventEmitterClass(), constructor)
    }
    return try runtime.createClass(name: name, constructor)
  }

  /// Builds a prototype for a `@SharedObject` class in an alternate runtime (e.g. the worklet runtime),
  /// inheriting from the given prototype: the prototype of the superclass in that runtime, or the base prototype.
  /// The counterpart of `ClassDefinition.buildPrototype` for the classes that a module registers in `_classTypes`.
  @JavaScriptActor
  static func buildSharedObjectPrototype(
    _ type: any AnyJavaScriptClass.Type,
    in runtime: JavaScriptRuntime,
    basePrototype: consuming JavaScriptObject
  ) throws -> JavaScriptObject {
    let prototype = runtime.createObject(prototype: basePrototype)
    if type.bindsOwnJSMembers {
      try type._decorateClass(prototype: prototype, in: runtime)
    }
    return prototype
  }
}
