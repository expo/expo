// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// A native class with a JavaScript class: a `SharedObject` subclass, or a class with the `@JSClass` macro.
public protocol AnyJavaScriptClass: AnyObject {
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
  /// cast specializes in the caller's module as a plain class cast.
  @JavaScriptActor
  @inlinable
  public static func _native(from object: borrowing JavaScriptObject) throws -> Self {
    let native = try JavaScriptClassNativeState.native(from: object)
    guard let instance = native as? Self else {
      throw JavaScriptClassNativeState.TypeMismatchException((expected: Self.self, actual: Swift.type(of: native)))
    }
    return instance
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

/// The native state that pairs the JavaScript object of a `@JSClass` class with its native instance. The JavaScript
/// constructor attaches it. It holds the instance strongly, so the instance lives at least as long as the object.
@usableFromInline
internal final class JavaScriptClassNativeState: JavaScriptNativeState {
  @usableFromInline
  let native: AnyObject

  init(native: AnyObject) {
    self.native = native
    super.init()
  }

  /// Returns the native instance that the native state of the given JavaScript object holds.
  @JavaScriptActor
  @usableFromInline
  static func native(from object: borrowing JavaScriptObject) throws -> AnyObject {
    guard let nativeState = object.getNativeState(as: JavaScriptClassNativeState.self) else {
      throw NotFoundException()
    }
    return nativeState.native
  }

  /// Thrown when a JavaScript object has no native instance, for example an object that the constructor of a native
  /// class didn't create.
  internal final class NotFoundException: Exception, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_INSTANCE_NOT_FOUND"
    }

    override var reason: String {
      "The JavaScript object has no native instance, because the constructor of a native class didn't create it. Pass an object that you created with `new`."
    }
  }

  /// Thrown when the native instance of a JavaScript object isn't the expected class. `@usableFromInline`, so the
  /// inlinable `_native(from:)` can throw it.
  @usableFromInline
  internal final class TypeMismatchException: GenericException<(expected: Any.Type, actual: Any.Type)>, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_INSTANCE_TYPE_MISMATCH"
    }

    override var reason: String {
      "Expected the native instance to be '\(param.expected)', but found '\(param.actual)'. Pass an instance of the class that the function takes."
    }
  }

  /// Thrown when JavaScript calls the constructor of a class that doesn't declare a `@JS init`.
  internal final class ConstructorUnavailableException: GenericException<String>, @unchecked Sendable {
    override var code: String {
      "ERR_CONSTRUCTOR_UNAVAILABLE"
    }

    override var reason: String {
      "'\(param)' cannot be constructed from JavaScript, because its native class doesn't declare a `@JS init`. Add a `@JS init` to the native class."
    }
  }
}
