// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 An array buffer that manages its own native memory or borrows native-backed memory.
 Does not require a JavaScript runtime at creation time — the JSI backing buffer
 is created on demand when the buffer needs to be returned to JavaScript.

 - Note: Sendable conformance is `@unchecked` because `UnsafeMutableRawPointer` isn't `Sendable`.
 */
public final class ArrayBuffer: AnyArrayBuffer, @unchecked Sendable {
  private enum Storage {
    case owned(pointer: UnsafeMutableRawPointer, count: Int, cleanup: () -> Void)
    case borrowed(pointer: UnsafeMutableRawPointer, count: Int, cleanup: () -> Void)

    var rawPointer: UnsafeMutableRawPointer {
      switch self {
      case let .owned(pointer, _, _), let .borrowed(pointer, _, _):
        return pointer
      }
    }

    var byteLength: Int {
      switch self {
      case let .owned(_, count, _), let .borrowed(_, count, _):
        return count
      }
    }

    var isOwned: Bool {
      switch self {
      case .owned:
        return true
      case .borrowed:
        return false
      }
    }

    func cleanup() {
      switch self {
      case let .owned(_, _, cleanup), let .borrowed(_, _, cleanup):
        cleanup()
      }
    }
  }

  private let storage: Storage

  private var rawPointer: UnsafeMutableRawPointer {
    return storage.rawPointer
  }

  public var byteLength: Int {
    return storage.byteLength
  }

  public var isOwned: Bool {
    return storage.isOwned
  }

  init(wrapping data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.storage = .owned(pointer: data, count: count, cleanup: cleanup)
  }

  init(borrowing data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.storage = .borrowed(pointer: data, count: count, cleanup: cleanup)
  }

  deinit {
    storage.cleanup()
  }

  // MARK: - AnyArrayBuffer

  /**
   Creates a native-owned copy of this ArrayBuffer.
   */
  public func copy() -> ArrayBuffer {
    return ArrayBuffer.copy(of: rawPointer, count: byteLength)
  }

  public var data: Data {
    let retained = Unmanaged.passRetained(self)
    return Data(
      bytesNoCopy: rawPointer,
      count: byteLength,
      deallocator: .custom({ _, _ in retained.release() }))
  }

  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeRawBufferPointer(start: rawPointer, count: byteLength))
  }

  public func withUnsafeMutableBytes<R>(_ body: (UnsafeMutableRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeMutableRawBufferPointer(start: rawPointer, count: byteLength))
  }

  // MARK: - JavaScript conversion

  /**
   Returns a `JavaScriptArrayBuffer` that wraps the native memory managed by this buffer.
   The native buffer is retained for the lifetime of the `JavaScriptArrayBuffer`.
   */
  func asJavaScriptArrayBuffer(runtime: JavaScriptRuntime) -> JavaScriptArrayBuffer {
    return runtime.createArrayBuffer(
      data: rawPointer.assumingMemoryBound(to: UInt8.self),
      size: byteLength
    ) { [self] in
      // Retain `self` until the JS engine releases the ArrayBuffer. When this
      // closure is dropped, the buffer deinits and deallocates its memory.
      _ = self
    }
  }

  // MARK: - Allocate

  /**
   Allocates a new native ArrayBuffer of the given size with zero-initialized memory.
   */
  public static func allocate(size: Int, initializeToZero: Bool = true) -> ArrayBuffer {
    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
    if initializeToZero {
      data.initialize(repeating: 0, count: size)
    }
    return ArrayBuffer(wrapping: data, count: size) {
      data.deallocate()
    }
  }

  // MARK: - Copy

  /**
   Copies the given raw pointer into a new native ArrayBuffer.
   */
  public static func copy(of other: UnsafeRawPointer, count: Int) -> ArrayBuffer {
    if count == 0 {
      return ArrayBuffer.allocate(size: 0, initializeToZero: false)
    }
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: other.assumingMemoryBound(to: UInt8.self), count: count)

    return ArrayBuffer(wrapping: copy, count: count) {
      copy.deallocate()
    }
  }

  /**
   Copies the given Data into a new native ArrayBuffer.
   */
  public static func copy(data: Data) throws -> ArrayBuffer {
    let size = data.count
    if size == 0 {
      return ArrayBuffer.allocate(size: 0, initializeToZero: false)
    }
    let arrayBuffer = ArrayBuffer.allocate(size: size, initializeToZero: false)

    try data.withUnsafeBytes { rawPointer in
      guard let baseAddress = rawPointer.baseAddress else {
        throw MissingBaseAddressError()
      }
      memcpy(arrayBuffer.rawPointer, baseAddress, size)
    }
    return arrayBuffer
  }

  // MARK: - Wrap

  /**
   Wraps the given raw buffer pointer in an ArrayBuffer without copying data.
   */
  public static func wrap(
    dataWithoutCopy data: UnsafeMutableRawBufferPointer,
    cleanup: @escaping () -> Void
  ) throws -> ArrayBuffer {
    guard let baseAddress = data.baseAddress else {
      throw MissingBaseAddressError()
    }
    return ArrayBuffer(wrapping: baseAddress, count: data.count, cleanup: cleanup)
  }

  /**
   Zero-copy wraps the given Data object in an ArrayBuffer. The Data's backing store
   is retained for the lifetime of the returned buffer.

   - Warning: This bypasses Data's copy-on-write capabilities, effectively allowing
   mutation of the Data from JavaScript code.
   */
  public static func wrap(dataWithoutCopy data: Data) -> ArrayBuffer {
    let retained = Unmanaged.passRetained(data as NSData)
    let pointer = UnsafeMutableRawPointer(mutating: retained.takeUnretainedValue().bytes)
    return ArrayBuffer(wrapping: pointer, count: data.count) {
      retained.release()
    }
  }

  // MARK: - JavaScript conversion

  /**
   Converts a JavaScript ArrayBuffer or TypedArray to Expo's safe native ArrayBuffer representation.
   */
  internal static func from(jsValue: JavaScriptValue) throws -> ArrayBuffer {
    if jsValue.isTypedArray() {
      let typedArray = jsValue.getTypedArray()
      let count = typedArray.byteLength

      if count == 0 {
        return ArrayBuffer.allocate(size: 0)
      }
      return try typedArray.withUnsafeBytes { bytes in
        let backingBuffer = typedArray.getArrayBuffer()
        if let borrowed = backingBuffer.tryBorrowMutableBuffer() {
          return ArrayBuffer(
            borrowing: UnsafeMutableRawPointer(borrowed.data.advanced(by: typedArray.byteOffset)),
            count: count,
            cleanup: {
              _ = borrowed
            })
        }
        return ArrayBuffer.copy(of: bytes.baseAddress!, count: count)
      }
    }
    guard jsValue.isArrayBuffer() else {
      throw ArrayBufferJavaScriptValueConversionException(jsValue.kind)
    }
    let jsArrayBuffer = jsValue.getArrayBuffer()

    if jsArrayBuffer.size == 0 {
      return ArrayBuffer.allocate(size: 0)
    }
    if let borrowed = jsArrayBuffer.tryBorrowMutableBuffer() {
      return ArrayBuffer(
        borrowing: UnsafeMutableRawPointer(borrowed.data),
        count: borrowed.size,
        cleanup: {
          _ = borrowed
        })
    }
    return ArrayBuffer.copy(of: UnsafeRawPointer(jsArrayBuffer.data()), count: jsArrayBuffer.size)
  }
}

extension ArrayBuffer: JavaScriptDecodable, JavaScriptEncodable {
  @JavaScriptActor
  public static func decode(
    _ value: JavaScriptValue,
    appContext: borrowing AppContext,
    runtime: borrowing JavaScriptRuntime
  ) throws -> ArrayBuffer {
    return try ArrayBuffer.from(jsValue: value)
  }

  @JavaScriptActor
  public static func encode(
    _ value: ArrayBuffer,
    appContext: borrowing AppContext,
    runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    return value.asJavaScriptArrayBuffer(runtime: copy runtime).asValue()
  }
}

internal final class ArrayBufferJavaScriptValueConversionException:
  GenericException<JavaScriptValue.Kind>, @unchecked Sendable {
  override var reason: String {
    "Given argument is not an ArrayBuffer or TypedArray, got \(param.rawValue)"
  }
}
