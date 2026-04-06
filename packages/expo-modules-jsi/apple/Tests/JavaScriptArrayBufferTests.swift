import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptArrayBufferTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Creation

  @Test
  func `create array buffer with specified size`() {
    let buffer = runtime.createArrayBuffer(size: 64)
    #expect(buffer.size == 64)
  }

  @Test
  func `create array buffer with zero size`() {
    let buffer = runtime.createArrayBuffer(size: 0)
    #expect(buffer.size == 0)
  }

  @Test
  func `create array buffer has zero-initialized memory`() {
    let buffer = runtime.createArrayBuffer(size: 8)
    let ptr = buffer.data()
    for i in 0..<8 {
      #expect(ptr[i] == 0)
    }
  }

  @Test
  func `create array buffer wrapping native data`() {
    nonisolated(unsafe) let data = UnsafeMutablePointer<UInt8>.allocate(capacity: 4)
    data[0] = 10
    data[1] = 20
    data[2] = 30
    data[3] = 40

    let buffer = runtime.createArrayBuffer(data: data, size: 4) {
      data.deallocate()
    }

    #expect(buffer.size == 4)
    #expect(buffer.data()[0] == 10)
    #expect(buffer.data()[1] == 20)
    #expect(buffer.data()[2] == 30)
    #expect(buffer.data()[3] == 40)
  }

  @Test
  func `create array buffer from JavaScript`() throws {
    let value = try runtime.eval("new ArrayBuffer(32)")
    let object = value.getObject()

    #expect(object.isArrayBuffer() == true)

    let buffer = object.getArrayBuffer()
    #expect(buffer.size == 32)
  }

  // MARK: - Data access

  @Test
  func `read and write through data pointer`() {
    let buffer = runtime.createArrayBuffer(size: 4)
    let ptr = buffer.data()

    ptr[0] = 0xDE
    ptr[1] = 0xAD
    ptr[2] = 0xBE
    ptr[3] = 0xEF

    #expect(ptr[0] == 0xDE)
    #expect(ptr[1] == 0xAD)
    #expect(ptr[2] == 0xBE)
    #expect(ptr[3] == 0xEF)
  }

  @Test
  func `native writes are visible from JavaScript`() throws {
    let buffer = runtime.createArrayBuffer(size: 4)
    buffer.data()[0] = 42

    runtime.global().setProperty("buf", value: buffer.asValue())
    let result = try runtime.eval("new Uint8Array(buf)[0]")

    #expect(result.getInt() == 42)
  }

  @Test
  func `JavaScript writes are visible from native`() throws {
    let buffer = runtime.createArrayBuffer(size: 4)
    runtime.global().setProperty("buf", value: buffer.asValue())

    try runtime.eval("new Uint8Array(buf)[0] = 99")

    #expect(buffer.data()[0] == 99)
  }

  // MARK: - Copy

  @Test
  func `copy creates independent buffer`() {
    let original = runtime.createArrayBuffer(size: 4)
    original.data()[0] = 42

    let copied = original.copy()

    #expect(copied.size == 4)
    #expect(copied.data()[0] == 42)

    // Mutating the copy does not affect the original
    copied.data()[0] = 99
    #expect(original.data()[0] == 42)
    #expect(copied.data()[0] == 99)
  }

  @Test
  func `copy preserves all data`() {
    let original = runtime.createArrayBuffer(size: 8)
    let ptr = original.data()
    for i: UInt8 in 0..<8 {
      ptr[Int(i)] = i * 10
    }

    let copied = original.copy()
    let copiedPtr = copied.data()

    for i: UInt8 in 0..<8 {
      #expect(copiedPtr[Int(i)] == i * 10)
    }
  }

  // MARK: - Conversions

  @Test
  func `asValue returns a valid JavaScript value`() {
    let buffer = runtime.createArrayBuffer(size: 16)
    let value = buffer.asValue()

    #expect(value.isObject() == true)
    #expect(value.getObject().isArrayBuffer() == true)
  }

  @Test
  func `asValue preserves buffer identity`() throws {
    let buffer = runtime.createArrayBuffer(size: 8)
    buffer.data()[0] = 123

    runtime.global().setProperty("buf", value: buffer.asValue())
    let readBack = try runtime.eval("new Uint8Array(buf)[0]")

    #expect(readBack.getInt() == 123)
  }

  // MARK: - Properties

  @Test
  func `getProperty reads byteLength`() {
    let buffer = runtime.createArrayBuffer(size: 64)
    let byteLength = buffer.getProperty("byteLength")

    #expect(byteLength.isNumber() == true)
    #expect(byteLength.getInt() == 64)
  }

  // MARK: - Cleanup

  @Test
  func `cleanup is called when buffer is collected`() async throws {
    var cleanupCalled = false
    nonisolated(unsafe) let flag = UnsafeMutablePointer<Bool>.allocate(capacity: 1)
    flag.initialize(to: false)

    do {
      nonisolated(unsafe) let data = UnsafeMutablePointer<UInt8>.allocate(capacity: 8)
      _ = runtime.createArrayBuffer(data: data, size: 8) {
        data.deallocate()
        flag.pointee = true
      }
      // Buffer goes out of scope here
    }

    // Hermes gc() is synchronous, so the buffer should be collected immediately.
    try runtime.eval("gc()")

    cleanupCalled = flag.pointee
    flag.deallocate()

    #expect(cleanupCalled)
  }
}
