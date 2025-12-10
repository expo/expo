// Copyright 2022-present 650 Industries. All rights reserved.

public class ArrayBuffer: AnyArrayBuffer {
  let backingBuffer: RawArrayBuffer
  
  internal required init(_ RawArrayBuffer: RawArrayBuffer) {
    self.backingBuffer = RawArrayBuffer
  }
  
  public lazy var byteLength: Int = backingBuffer.getSize();
  
  public lazy var rawPointer: UnsafeMutableRawPointer = backingBuffer.getUnsafeMutableRawPointer();
  
  public func copy() -> NativeArrayBuffer {
    ArrayBuffer.copy(of: self)
  }
  
  /**
   * Wrap this `ArrayBuffer` in a `Data` instance, without performing a copy.
   * - `copyIfNeeded`: If this `ArrayBuffer` is **non-owning**, the foreign
   *                   data may needs to be copied to be safely used outside of the scope of the caller function.
   *                   This flag controls that.
   */
  public var data: Data {
      let sharedPointer = backingBuffer.memoryStrongRef()
      
      return Data(
        bytesNoCopy: rawPointer,
        count: byteLength,
        deallocator: .custom({ _,_ in sharedPointer?.reset() }))
  }
  
  public func mutableData() -> NSMutableData {
      let sharedPointer = backingBuffer.memoryStrongRef()
    
      return NSMutableData(
        bytesNoCopy: rawPointer,
        length: byteLength,
        deallocator: { _,_ in sharedPointer?.reset() }
      )
  }
}
