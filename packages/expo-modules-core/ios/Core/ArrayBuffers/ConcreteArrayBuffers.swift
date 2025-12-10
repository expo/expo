
public class GenericArrayBuffer<BufferType: RawArrayBuffer>: ArrayBuffer {
  internal convenience init(_ backingBuffer: BufferType) {
    self.init(backingBuffer as RawArrayBuffer)
  }
}

public final class NativeArrayBuffer: GenericArrayBuffer<RawNativeArrayBuffer> {
  convenience init(wrapping data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    let backingBuffer = RawNativeArrayBuffer(data: data, size: count, cleanup: cleanup)
    self.init(backingBuffer)
  }
}

public final class JavaScriptArrayBuffer: GenericArrayBuffer<RawJavaScriptArrayBuffer> {
}
