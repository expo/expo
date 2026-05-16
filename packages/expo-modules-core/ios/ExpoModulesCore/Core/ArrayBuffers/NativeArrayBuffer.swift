// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 An array buffer that manages its own native memory.
 Does not require a JavaScript runtime at creation time — the JSI backing buffer
 is created on demand when the buffer needs to be returned to JavaScript.

 - Note: Sendable conformance is `@unchecked` because `UnsafeMutableRawPointer` isn't `Sendable`,
   but the buffer has exclusive ownership of its memory.
 */
public final class NativeArrayBuffer: AnyArrayBuffer, @unchecked Sendable {
  private let rawPointer: UnsafeMutableRawPointer
  public let byteLength: Int
  private let cleanup: (() -> Void)?

  init(wrapping data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.rawPointer = data
    self.byteLength = count
    self.cleanup = cleanup
  }

  deinit {
    cleanup?()
  }

  // MARK: - AnyArrayBuffer

  public func copy() -> NativeArrayBuffer {
    return NativeArrayBuffer.copy(of: rawPointer, count: byteLength)
  }

  public var data: Data {
    let retained = Unmanaged.passRetained(self)
    return Data(
      bytesNoCopy: rawPointer,
      count: byteLength,
      deallocator: .custom { _, _ in
        retained.release()
      }
    )
  }

  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeRawBufferPointer(start: rawPointer, count: byteLength))
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
  public static func allocate(size: Int, initializeToZero: Bool = true) -> NativeArrayBuffer {
    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
    if initializeToZero {
      data.initialize(repeating: 0, count: size)
    }
    return NativeArrayBuffer(wrapping: data, count: size) {
      data.deallocate()
    }
  }

  // MARK: - Copy

  /**
   Copies the given raw pointer into a new native ArrayBuffer.
   */
  public static func copy(of other: UnsafeRawPointer, count: Int) -> NativeArrayBuffer {
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: other.assumingMemoryBound(to: UInt8.self), count: count)

    return NativeArrayBuffer(wrapping: copy, count: count) {
      copy.deallocate()
    }
  }

  /**
   Copies the given Data into a new native ArrayBuffer.
   */
  public static func copy(data: Data) throws -> NativeArrayBuffer {
    let size = data.count
    let arrayBuffer = NativeArrayBuffer.allocate(size: size, initializeToZero: false)

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
  ) throws -> NativeArrayBuffer {
    guard let baseAddress = data.baseAddress else {
      throw MissingBaseAddressError()
    }
    return NativeArrayBuffer(wrapping: baseAddress, count: data.count, cleanup: cleanup)
  }

  /**
   Zero-copy wraps the given Data object in an ArrayBuffer. The Data's backing store
   is retained for the lifetime of the returned buffer.

   - Warning: This bypasses Data's copy-on-write capabilities, effectively allowing
   mutation of the Data from JavaScript code.
   */
  public static func wrap(dataWithoutCopy data: Data) -> NativeArrayBuffer {
    let retained = Unmanaged.passRetained(data as NSData)
    let pointer = UnsafeMutableRawPointer(mutating: retained.takeUnretainedValue().bytes)
    return NativeArrayBuffer(wrapping: pointer, count: data.count) {
      retained.release()
    }
  }
}

extension NativeArrayBuffer: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> NativeArrayBuffer {
    fatalError("Creating NativeArrayBuffer from JavaScriptValue is not supported")
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asJavaScriptArrayBuffer(runtime: runtime).asValue()
  }
}

/**
 An exception thrown when `baseAddress` of `UnsafeMutableRawBufferPointer` is `nil`.
 */
public final class MissingBaseAddressError: Exception, @unchecked Sendable {
  override public var reason: String {
    "Cannot get baseAddress of given data"
  }
}
