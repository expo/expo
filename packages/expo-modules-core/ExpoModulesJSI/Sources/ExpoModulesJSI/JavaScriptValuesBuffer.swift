// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi

public struct JSValuesBuffer: JavaScriptType, ~Copyable {
  internal/*!*/ weak var runtime: JavaScriptRuntime?
  internal/*!*/ nonisolated(unsafe) let bufferPointer: UnsafeMutableBufferPointer<facebook.jsi.Value>

  /**
   A pointer to the first value of the buffer.
   If the baseAddress of this buffer is `nil`, the `count` is zero.
   */
  internal/*!*/ var baseAddress: UnsafePointer<facebook.jsi.Value>? {
    return UnsafePointer(bufferPointer.baseAddress)
  }

  /**
   The number of values in the buffer.
   */
  public var count: Int {
    return bufferPointer.count
  }

  internal/*!*/ init(_ runtime: JavaScriptRuntime, buffer: consuming UnsafeMutableBufferPointer<facebook.jsi.Value>) {
    self.runtime = runtime
    self.bufferPointer = Self.copying(in: runtime, buffer: buffer)
  }

  internal/*!*/ init(_ runtime: JavaScriptRuntime, start: consuming UnsafePointer<facebook.jsi.Value>?, count: Int) {
    self.init(runtime, buffer: UnsafeMutableBufferPointer(start: UnsafeMutablePointer(mutating: start), count: count))
  }

  internal/*!*/ init(_ runtime: JavaScriptRuntime, buffer: consuming UnsafeBufferPointer<facebook.jsi.Value>) {
    self.init(runtime, buffer: UnsafeMutableBufferPointer(mutating: buffer))
  }

  public subscript(index: Int) -> JavaScriptValue {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return JavaScriptValue(runtime, facebook.jsi.Value(runtime.pointee, bufferPointer[index]))
  }

  @discardableResult
  internal consuming func set<T: JSIRepresentable>(value: borrowing T, atIndex index: Int) -> JSValuesBuffer where T: ~Copyable {
    guard let jsiRuntime = runtime?.pointee else {
      JS.runtimeLostFatalError()
    }
    guard index < count else {
      fatalError("Cannot add values to a JSValuesBuffer beyond its capacity")
    }
    bufferPointer.initializeElement(at: index, to: value.toJSIValue(in: jsiRuntime))
    return self
  }

  @JavaScriptActor
  public func map<T>(_ transform: @JavaScriptActor (_ value: consuming JavaScriptValue, _ index: Int) throws -> T) rethrows -> [T] {
    var result: [T] = []
    result.reserveCapacity(count)
    for index in 0..<count {
      let value = self[index]
      let transformed = try transform(value, index)
      result.append(transformed)
    }
    return result
  }

  // MARK: - JavaScriptType

  public func asValue() -> JavaScriptValue {
    // TODO: Should we return an array instead?
    fatalError("JavaScriptValueBuffer cannot be represented as a single value")
  }

  // MARK: - Allocation

  /**
   Allocates new values buffer with the given capacity. The buffer is in uninitialized state.
   You must initialize all elements using `set(value:atIndex)` method.
   */
  public static func allocate(in runtime: JavaScriptRuntime, capacity: Int) -> JSValuesBuffer {
    return JSValuesBuffer(runtime, buffer: UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: capacity))
  }

  /**
   Allocates new values buffer with the given JS representables.
   Note that parameter packs still do not support non-copyable types so they need to be passed as `JavaScriptRef`.
   */
  public static func allocate<each T: JSRepresentable>(in runtime: JavaScriptRuntime, with values: repeat each T) -> JSValuesBuffer {
    // First we count parameters in a pack to find the proper buffer capacity. This is still the simplest way.
    var capacity = 0
    for _ in repeat each values {
      capacity += 1
    }

    // Allocate the buffer
    let buffer = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: capacity)
    var index: Int = 0

    // Iterate over the values again to initialize buffer's elements
    for value in repeat each values {
      if let value = value as? JSIRepresentable {
        buffer.initializeElement(at: index, to: value.toJSIValue(in: runtime.pointee))
      } else {
        buffer.initializeElement(at: index, to: value.toJSValue(in: runtime).pointee)
      }
      index += 1
    }
    return JSValuesBuffer(runtime, buffer: buffer)
  }

  public static func allocate<RefType: JSRepresentable & ~Copyable>(in runtime: JavaScriptRuntime, refs: [JavaScriptRef<RefType>]) -> JSValuesBuffer {
    let buffer = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: refs.count)
    for (index, ref) in refs.enumerated() {
      if let value = ref.take() {
        buffer.initializeElement(at: index, to: value.toJSValue(in: runtime).pointee)
      } else {
        buffer.initializeElement(at: index, to: .undefined())
      }
    }
    return JSValuesBuffer(runtime, buffer: buffer)
  }

  internal static func copying(in runtime: JavaScriptRuntime, buffer: UnsafeMutableBufferPointer<facebook.jsi.Value>) -> UnsafeMutableBufferPointer<facebook.jsi.Value> {
    let copy = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: buffer.count)
    for index in 0..<buffer.count {
      copy.initializeElement(at: index, to: facebook.jsi.Value(runtime.pointee, buffer[index]))
    }
    return copy
  }
}
