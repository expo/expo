
extension ArrayBuffer {
  // MARK: - Wrap
  
  public static func wrap(
    dataWithoutCopy data: UnsafeMutableRawBufferPointer,
    cleanup: @escaping () -> Void
  ) throws -> NativeArrayBuffer {
    guard let baseAddress = data.baseAddress else {
      throw Exception(name: "DataError", description: "Cannot get baseAddress of Data!")
    }
    return NativeArrayBuffer(wrapping: baseAddress, count: data.count, cleanup: cleanup)
  }
  
    // zero-copy wraps given Data object.
    // WARN: It bypasses the copy-on-write Data capabilities, effectively allowing to
    // mutate it in-place from JS
  public static func wrap(dataWithoutCopy data: Data) -> ArrayBuffer {
    let size = data.count
    let unamanagedData = Unmanaged.passRetained(data as NSData)
    
    let pointer: UnsafePointer<UInt8> = unamanagedData
      .takeUnretainedValue()
      .bytes
      .assumingMemoryBound(to: UInt8.self)
    let mutablePtr = UnsafeMutablePointer(mutating: pointer)
    
      // This should manage the memory of the underlying Data manually
    return NativeArrayBuffer(wrapping: mutablePtr, count: size, cleanup: { unamanagedData.release() })
  }

// MARK: - Allocate

  /**
   * Allocate a new buffer of the given `size`.
   * If `initializeToZero` is `true`, all bytes are set to `0`, otherwise they are left untouched.
   */
  public static func allocate(size: Int, initializeToZero: Bool = false) -> NativeArrayBuffer {
    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
    if initializeToZero {
      data.initialize(repeating: 0, count: size)
    }
    let deleteFunc = {
      data.deallocate()
    }
    return NativeArrayBuffer(wrapping: data, count: size, cleanup: deleteFunc)
  }
  
  // MARK: - Copy

  /**
   * Copy the given `UnsafeRawPointer` into a new **owning** `ArrayBuffer`.
   */
  public static func copy(
    of other: UnsafeRawPointer,
    count: Int
  ) -> NativeArrayBuffer {
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: other.assumingMemoryBound(to: UInt8.self), count: count)
    return NativeArrayBuffer(wrapping: copy, count: count, cleanup: { copy.deallocate() })
  }
  
  public static func copy(of other: UnsafeRawBufferPointer) throws -> NativeArrayBuffer {
    guard let baseAddress = other.baseAddress else {
      throw Exception(name: "DataError", description: "Cannot get baseAddress of Data!")
    }
    return ArrayBuffer.copy(of: baseAddress, count: other.count)
  }
  
  /**
   * Copy the given `Data` into a new **owning** `ArrayBuffer`.
   */
  public static func copy(data: Data) throws -> NativeArrayBuffer {
      // 1. Create new `ArrayBuffer` of same size
    let size = data.count
    let arrayBuffer = ArrayBuffer.allocate(size: size)
      // 2. Copy all bytes from `Data` into our new `ArrayBuffer`
    
    try data.withUnsafeBytes { rawPointer in
      guard let baseAddress = rawPointer.baseAddress else {
        throw Exception(name: "DataError", description: "Cannot get baseAddress of Data!")
      }
      
      memcpy(arrayBuffer.rawPointer, baseAddress, size)
    }
    return arrayBuffer
  }
  
  /**
   * Copy the given `ArrayBuffer` into a new **owning** `ArrayBuffer`.
   */
  public static func copy(of other: ArrayBuffer) -> NativeArrayBuffer {
    ArrayBuffer.copy(of: other.rawPointer, count: other.byteLength)
  }
}

// MARK: - Data

extension ArrayBuffer: ContiguousBytes {
  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    try body(UnsafeRawBufferPointer(start: self.rawPointer, count: self.byteLength))
  }
}
