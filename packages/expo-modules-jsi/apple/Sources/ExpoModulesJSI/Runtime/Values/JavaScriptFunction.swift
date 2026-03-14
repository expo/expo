// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptFunction: JavaScriptType, ~Copyable {
  internal weak var runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.Function

  internal/*!*/ init(_ runtime: JavaScriptRuntime, _ pointee: consuming facebook.jsi.Function) {
    self.runtime = runtime
    self.pointee = pointee
  }

  // MARK: - Calling
  /// In theory `call(this:arguments:)` and `call(arguments:)` could be combined into one with optional `this`,
  /// however it would require consuming `this` that we rather want to avoid (unwrapping is consuming).
  /// If `this` is consumed, something obvious like `object.getPropertyAsFunction("fn").call(this: object)` would be impossible.

  /**
   Calls the function with the given `this` object and buffer of arguments.
   */
  @discardableResult
  public func call(this: borrowing JavaScriptObject, arguments: consuming JavaScriptValuesBuffer? = nil) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return try capturingCppErrors {
      return JavaScriptValue(runtime, expo.callFunctionWithThis(runtime.pointee, pointee, this.pointee, arguments?.baseAddress, arguments?.count ?? 0))
    }
  }

  /**
   Calls the function with the given buffer of arguments.
   */
  @discardableResult
  public func call(arguments: consuming JavaScriptValuesBuffer? = nil) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return try capturingCppErrors {
      return JavaScriptValue(runtime, expo.callFunction(runtime.pointee, pointee, arguments?.baseAddress, arguments?.count ?? 0))
    }
  }

  /**
   Calls the function with the given `this` object and JS-representable arguments.
   */
  @discardableResult
  public func call<each T: JavaScriptRepresentable>(this: borrowing JavaScriptObject, arguments: repeat each T) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let argumentsBuffer = JavaScriptValuesBuffer.allocate(in: runtime, with: repeat each arguments)
    return try self.call(this: this, arguments: argumentsBuffer)
  }

  /**
   Calls the function with the given JS-representable arguments.
   */
  @discardableResult
  public func call<each T: JavaScriptRepresentable>(arguments: repeat each T) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let argumentsBuffer = JavaScriptValuesBuffer.allocate(in: runtime, with: repeat each arguments)
    return try self.call(arguments: argumentsBuffer)
  }

  /**
   Calls the function as a constructor with the given buffer of arguments. It's like calling a function with the `new` keyword.
   */
  public func callAsConstructor(_ arguments: consuming JavaScriptValuesBuffer? = nil) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return try capturingCppErrors {
      let jsiResult = expo.callAsConstructor(runtime.pointee, pointee, arguments?.baseAddress, arguments?.count ?? 0)
      return JavaScriptValue(runtime, jsiResult)
    }
  }

  /**
   Calls the function as a constructor with the given arguments. It's like calling a function with the `new` keyword.
   */
  public func callAsConstructor<each T: JavaScriptRepresentable>(_ arguments: repeat each T) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let argumentsBuffer = JavaScriptValuesBuffer.allocate(in: runtime, with: repeat each arguments)
    return try callAsConstructor(argumentsBuffer)
  }

  // MARK: - Conversions

  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime = runtime?.pointee else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, expo.valueFromFunction(jsiRuntime, pointee))
  }

  /**
   Returns the function as a `facebook.jsi.Value` instance.
   */
  internal func asJSIValue() -> facebook.jsi.Value {
    guard let jsiRunetime = runtime?.pointee else {
      FatalError.runtimeLost()
    }
    return expo.valueFromFunction(jsiRunetime, pointee)
  }

  public func asObject() -> JavaScriptObject {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let jsiRuntime = runtime.pointee
    return JavaScriptObject(runtime, expo.valueFromFunction(jsiRuntime, pointee).getObject(jsiRuntime))
  }
}

extension JavaScriptFunction: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> JavaScriptFunction {
    return value.getFunction()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptFunction: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> JavaScriptFunction {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}
