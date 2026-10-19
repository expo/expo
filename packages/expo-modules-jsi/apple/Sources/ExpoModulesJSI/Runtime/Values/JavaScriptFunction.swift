// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
internal import jsi

public struct JavaScriptFunction: JavaScriptType, ~Copyable {
  /// Handle to the runtime the function belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle
  internal let pointee: facebook.jsi.Function

  /// The runtime the function belongs to, or `nil` if it has been deallocated. Prefer ``jsiRuntime``
  /// on hot paths: it costs no reference counting.
  internal var runtime: JavaScriptRuntime? {
    return runtimeHandle.runtime
  }

  /// The engine runtime the function belongs to, or `nil` if the runtime has been deallocated.
  internal var jsiRuntime: facebook.jsi.IRuntime? {
    return runtimeHandle.pointee
  }

  internal init(_ runtime: borrowing JavaScriptRuntime, _ pointee: consuming facebook.jsi.Function) {
    self.runtimeHandle = runtime.handle
    self.pointee = pointee
  }

  /// Creates a function from an existing JSI function, which belongs to the runtime behind `runtimeHandle`.
  internal init(_ runtimeHandle: JavaScriptRuntimeHandle, _ pointee: consuming facebook.jsi.Function) {
    self.runtimeHandle = runtimeHandle
    self.pointee = pointee
  }

  // MARK: - Calling
  /// In theory `call(this:arguments:)` and `call(arguments:)` could be combined into one with optional `this`,
  /// however it would require consuming `this` that we rather want to avoid (unwrapping is consuming).
  /// If `this` is consumed, something obvious like `object.getPropertyAsFunction("fn").call(this: object)` would be impossible.

  /// Calls the function with the given `this` object and buffer of arguments.
  @discardableResult
  public func call(this: borrowing JavaScriptObject, arguments: consuming JavaScriptValuesBuffer? = nil) throws
    -> JavaScriptValue
  {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return try capturingCppErrors {
      return JavaScriptValue(
        runtimeHandle,
        expo.callFunctionWithThis(jsiRuntime, pointee, this.pointee, arguments?.baseAddress, arguments?.count ?? 0)
      )
    }
  }

  /// Calls the function with the given buffer of arguments.
  @discardableResult
  public func call(arguments: consuming JavaScriptValuesBuffer? = nil) throws -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return try capturingCppErrors {
      return JavaScriptValue(
        runtimeHandle,
        expo.callFunction(jsiRuntime, pointee, arguments?.baseAddress, arguments?.count ?? 0)
      )
    }
  }

  /// Calls the function with a single borrowed argument. The argument's `jsi::Value` is passed
  /// straight to the call, without copying it into an owned value or an arguments buffer.
  @discardableResult
  internal func call(argument: borrowing JavaScriptValue) throws -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    // `withUnsafeBytes(of:)` rather than `withUnsafePointer(to:)`; see `JavaScriptValue.withUnsafePointee(_:)`.
    return try withUnsafeBytes(of: argument.pointee) { bytes in
      let jsiArgument = bytes.baseAddress!.assumingMemoryBound(to: facebook.jsi.Value.self)
      return try capturingCppErrors {
        return JavaScriptValue(runtimeHandle, expo.callFunction(jsiRuntime, pointee, jsiArgument, 1))
      }
    }
  }

  /// Calls the function with the given `this` object and a single borrowed argument, passed the same
  /// way as in ``call(argument:)``.
  @discardableResult
  internal func call(this: borrowing JavaScriptObject, argument: borrowing JavaScriptValue) throws -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return try withUnsafeBytes(of: argument.pointee) { bytes in
      let jsiArgument = bytes.baseAddress!.assumingMemoryBound(to: facebook.jsi.Value.self)
      return try capturingCppErrors {
        return JavaScriptValue(
          runtimeHandle,
          expo.callFunctionWithThis(jsiRuntime, pointee, this.pointee, jsiArgument, 1)
        )
      }
    }
  }

  /// Calls the function with the given `this` object and JS-representable arguments.
  @discardableResult
  public func call<each T: JavaScriptRepresentable>(this: borrowing JavaScriptObject, arguments: repeat each T) throws
    -> JavaScriptValue
  {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let argumentsBuffer = JavaScriptValuesBuffer.allocate(in: runtime, with: repeat each arguments)
    return try self.call(this: this, arguments: argumentsBuffer)
  }

  /// Calls the function with the given JS-representable arguments.
  @discardableResult
  public func call<each T: JavaScriptRepresentable>(arguments: repeat each T) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let argumentsBuffer = JavaScriptValuesBuffer.allocate(in: runtime, with: repeat each arguments)
    return try self.call(arguments: argumentsBuffer)
  }

  /// Calls the function as a constructor with the given buffer of arguments. It's like calling a function with the `new` keyword.
  public func callAsConstructor(_ arguments: consuming JavaScriptValuesBuffer? = nil) throws -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return try capturingCppErrors {
      let jsiResult = expo.callAsConstructor(jsiRuntime, pointee, arguments?.baseAddress, arguments?.count ?? 0)
      return JavaScriptValue(runtimeHandle, jsiResult)
    }
  }

  /// Calls the function as a constructor with a single borrowed argument, passed the same way as in
  /// ``call(argument:)``.
  @usableFromInline
  internal func callAsConstructor(argument: borrowing JavaScriptValue) throws -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    // `withUnsafeBytes(of:)` rather than `withUnsafePointer(to:)`; see `JavaScriptValue.withUnsafePointee(_:)`.
    return try withUnsafeBytes(of: argument.pointee) { bytes in
      let jsiArgument = bytes.baseAddress!.assumingMemoryBound(to: facebook.jsi.Value.self)
      return try capturingCppErrors {
        return JavaScriptValue(runtimeHandle, expo.callAsConstructor(jsiRuntime, pointee, jsiArgument, 1))
      }
    }
  }

  /// Calls the function as a constructor with the given arguments. It's like calling a function with the `new` keyword.
  public func callAsConstructor<each T: JavaScriptRepresentable>(_ arguments: repeat each T) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let argumentsBuffer = JavaScriptValuesBuffer.allocate(in: runtime, with: repeat each arguments)
    return try callAsConstructor(argumentsBuffer)
  }

  // MARK: - Conversions

  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    assert(runtime?.isOnOwningThread() ?? true, "A JavaScript value was copied off its runtime's JavaScript thread")
    return JavaScriptValue(runtimeHandle, expo.valueFromFunction(jsiRuntime, pointee))
  }

  /// Returns the function as a `facebook.jsi.Value` instance.
  internal func asJSIValue() -> facebook.jsi.Value {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.valueFromFunction(jsiRuntime, pointee)
  }

  public func asObject() -> JavaScriptObject {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptObject(runtimeHandle, expo.objectFromFunction(jsiRuntime, pointee))
  }
}

extension JavaScriptFunction: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: borrowing JavaScriptValue) -> JavaScriptFunction {
    return value.getFunction()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptFunction: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime)
    -> JavaScriptFunction
  {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}
