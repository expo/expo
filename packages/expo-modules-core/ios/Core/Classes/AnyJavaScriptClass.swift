// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// A native class with a JavaScript class: a `SharedObject` subclass, or a class with the `@JSClass` macro.
public protocol AnyJavaScriptClass: AnyObject {
  /// The type of the native state that the JavaScript constructor of a `@JSClass` class attaches to the JavaScript
  /// object of an instance. A root class can set it to a subclass of `JavaScriptClassNativeState` that keeps more state
  /// with the JavaScript object, and then implements `makeNativeState(for:object:in:)`. Its subclasses use the same
  /// type.
  associatedtype NativeState: JavaScriptClassNativeState = JavaScriptClassNativeState

  /// Creates the native state that the JavaScript constructor of a `@JSClass` class attaches to `object`, the
  /// JavaScript object of `instance`. Core calls it before it attaches the native state. When the engine doesn't allow a
  /// native state on the object, for example a frozen one, the constructor throws and the deallocator of the native
  /// state runs. Core doesn't call it for a shared object, which the shared object registry pairs with its JavaScript
  /// object.
  ///
  /// The default implementation creates a `JavaScriptClassNativeState`, for a class that keeps the default
  /// `NativeState`.
  @JavaScriptActor
  static func makeNativeState(for instance: Self, object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime)
    -> NativeState

  // The hooks that the `@SharedObject` and `@JSClass` macros implement, which core calls when it builds the JavaScript
  // class. `SharedObject` and the root class of a `@JSClass` chain implement them with `class` members, so a call
  // through this protocol reaches the override of the subclass.

  /// The name of the class in JavaScript.
  static var _jsName: String { get }

  /// The class whose macro gives this class its JavaScript class: the class itself, or its nearest superclass with a
  /// macro. `nil` when no class in the chain has a macro.
  static var _jsClassType: (any AnyJavaScriptClass.Type)? { get }

  /// The nearest superclass with a macro, whose JavaScript class the JavaScript class of this class extends. `nil` for
  /// the base `SharedObject` or `SharedRef` class, and for a `@JSClass` class whose JavaScript class extends no class.
  static var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { get }

  /// Binds the `@JS` members of the class onto its JavaScript prototype.
  @JavaScriptActor
  static func _decorateClass(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws

  /// Binds the `static` and `class` `@JS` members of the class onto its JavaScript constructor.
  @JavaScriptActor
  static func _decorateClass(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws

  /// Builds a native instance from the arguments of the JavaScript constructor, or returns `nil` when the class has no
  /// `@JS init`.
  @JavaScriptActor
  static func _constructInstance(
    this: borrowing JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> (any AnyJavaScriptClass)?
}

extension AnyJavaScriptClass where NativeState == JavaScriptClassNativeState {
  @JavaScriptActor
  public static func makeNativeState(
    for instance: Self,
    object: borrowing JavaScriptObject,
    in runtime: JavaScriptRuntime
  ) -> NativeState {
    return JavaScriptClassNativeState(instance: instance)
  }
}

// MARK: - JavaScript class chain

extension AnyJavaScriptClass {
  /// Whether a macro gives this class a JavaScript class of its own. Core builds that class when it first needs it,
  /// also when no module registers the class.
  internal static var hasOwnJSClass: Bool {
    guard let classType = _jsClassType else {
      return false
    }
    return ObjectIdentifier(classType) == ObjectIdentifier(self)
  }

  /// Whether core binds the `@JS` members of this class with its decorate hooks. A class without a macro inherits the
  /// hooks of its nearest superclass with a macro. The JavaScript class of this class extends the JavaScript class of
  /// that superclass, which already has these members.
  internal static var bindsOwnJSMembers: Bool {
    return _jsClassType == nil || hasOwnJSClass
  }

  /// The superclass whose JavaScript class the JavaScript class of this class extends. `nil` for the base
  /// `SharedObject` or `SharedRef` class, and for a `@JSClass` class whose JavaScript class extends no class. It is
  /// `_jsSuperclassType` for a class with a macro. A class without a macro inherits `_jsSuperclassType` from its
  /// nearest superclass with a macro, so for that class it is that superclass itself.
  internal static var resolvedJSSuperclassType: (any AnyJavaScriptClass.Type)? {
    guard let classType = _jsClassType else {
      return nil
    }
    return ObjectIdentifier(classType) == ObjectIdentifier(self) ? _jsSuperclassType : classType
  }
}

// MARK: - Native instances

extension AnyJavaScriptClass {
  /// Returns the native instance of a JavaScript object that the JavaScript constructor of a `@JSClass` class created.
  /// The `@JSClass` macro calls it to get the receiver of an instance member. A shared object is read with
  /// `SharedObject.native(from:as:)` instead.
  ///
  /// Throws when the object has no native instance, or when its native instance isn't `Self`. `@inlinable`, so the
  /// casts to `NativeState` and `Self` specialize in the caller's module as plain class casts.
  @JavaScriptActor
  @inlinable
  public static func _native(from object: borrowing JavaScriptObject) throws -> Self {
    guard let instance = object.getNativeState(as: NativeState.self)?.instance as? Self else {
      throw nativeInstanceError(for: object)
    }
    return instance
  }

  /// The error for an object without a native instance of this class: a type mismatch when the object has a native
  /// instance of another class, otherwise not found.
  @JavaScriptActor
  @usableFromInline
  internal static func nativeInstanceError(for object: borrowing JavaScriptObject) -> any Error {
    guard let native = object.getNativeState(as: JavaScriptClassNativeState.self)?.instance else {
      return JavaScriptClassNativeState.NotFoundException(_jsName)
    }
    return JavaScriptClassNativeState.TypeMismatchException((expected: _jsName, actual: Swift.type(of: native)._jsName))
  }
}

// A `@JSClass` root class declares the `JavaScriptDecodable` conformance without implementations, so that a `@JS`
// function can take an instance of the class as an argument. `SharedObject` has implementations of its own.
extension JavaScriptDecodable where Self: AnyJavaScriptClass {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Self
  {
    return try _native(from: value.asObject(in: runtime))
  }
}

/// The native state that pairs a JavaScript object with its native instance. The JavaScript constructor of a `@JSClass`
/// class attaches it. It holds the instance strongly, so the instance lives at least as long as the object.
///
/// A root class can use a subclass of it as its `NativeState`. The native state of an event emitter is a subclass too,
/// so `_native(from:)` reads the instance of any object with one cast. The native state of a shared object holds the
/// shared object. A module object and a plain `expo.EventEmitter` object have no instance.
open class JavaScriptClassNativeState: JavaScriptNativeState {
  /// The native instance, or `nil` for an object that has no native instance.
  public let instance: (any AnyJavaScriptClass)?

  /// Creates a native state for a JavaScript object whose native instance is `instance`.
  public init(instance: (any AnyJavaScriptClass)?) {
    self.instance = instance
    super.init()
  }

  // The parameters of the exceptions are JavaScript class names.

  /// Thrown when a JavaScript object has no native instance, for example an object that the constructor of the
  /// expected class didn't create.
  internal final class NotFoundException: GenericException<String>, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_INSTANCE_NOT_FOUND"
    }

    override var reason: String {
      """
      Expected an instance of '\(param)', but got an object that the constructor of '\(param)' didn't create. Pass an \
      object that you created with `new \(param)`.
      """
    }
  }

  /// Thrown when the native instance of a JavaScript object isn't the expected class.
  internal final class TypeMismatchException:
    GenericException<(expected: String, actual: String)>, @unchecked Sendable
  {
    override var code: String {
      "ERR_NATIVE_INSTANCE_TYPE_MISMATCH"
    }

    override var reason: String {
      """
      Expected an instance of '\(param.expected)', but got an instance of '\(param.actual)'. Pass an instance of \
      '\(param.expected)' or of a subclass of it.
      """
    }
  }

  /// Thrown when the JavaScript constructor is called on an object that has a native state already, for example with
  /// `Point.call(point)`.
  internal final class AlreadyAttachedException: GenericException<String>, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_INSTANCE_ALREADY_ATTACHED"
    }

    override var reason: String {
      """
      The constructor of '\(param)' was called on an object that has a native instance already, so it didn't create \
      another one. Create a new object with `new \(param)`.
      """
    }
  }

  /// Thrown when the JavaScript constructor can't attach the native instance to `this`.
  internal final class NotAttachableException: GenericException<String>, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_INSTANCE_NOT_ATTACHABLE"
    }

    override var reason: String {
      """
      The constructor of '\(param)' couldn't attach the native instance to the object. The JavaScript engine doesn't \
      allow it on a Proxy, a host object, or an object that can't get new properties, for example a frozen one. Create \
      the object with `new \(param)`, and freeze it only after the constructor returns.
      """
    }
  }

  /// Thrown when JavaScript calls the constructor of a class that doesn't declare a `@JS init`.
  internal final class ConstructorUnavailableException: GenericException<String>, @unchecked Sendable {
    override var code: String {
      "ERR_CONSTRUCTOR_UNAVAILABLE"
    }

    override var reason: String {
      """
      '\(param)' cannot be constructed from JavaScript, because its native class doesn't declare a `@JS init`. Add a \
      `@JS init` to the native class.
      """
    }
  }
}
