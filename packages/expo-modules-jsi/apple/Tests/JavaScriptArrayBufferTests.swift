import ExpoModulesJSI
import Testing

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
  func `create array buffer reports its memory to the garbage collector`() throws {
    let externalBytes = "HermesInternal.getInstrumentedStats().js_externalBytes"
    let bytesBefore = try runtime.eval(externalBytes).getDouble()
    let buffer = runtime.createArrayBuffer(size: 1 << 20)
    let bytesAfter = try runtime.eval(externalBytes).getDouble()
    #expect(buffer.size == 1 << 20)
    #expect(bytesAfter - bytesBefore >= Double(1 << 20))
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

    runtime.collectGarbage { flag.pointee }

    cleanupCalled = flag.pointee
    flag.deallocate()

    #expect(cleanupCalled)
  }

  // MARK: - JavaScriptCodable

  @Test
  func `decodes and encodes as JavaScriptCodable`() throws {
    try runtime.eval("globalThis.buffer = new Uint8Array([1, 2, 3]).buffer")
    let value = try runtime.eval("globalThis.buffer")
    let buffer = try JavaScriptArrayBuffer.decode(value, in: runtime)
    #expect(buffer.size == 3)
    #expect(buffer.data()[2] == 3)
    let encoded = try JavaScriptArrayBuffer.encode(buffer, in: runtime)
    let isSame = try runtime.eval("(value) => value === globalThis.buffer").getFunction()
    #expect(try isSame.call(arguments: encoded.ref()).getBool() == true)
  }

  @Test
  func `decodes from an unowned value`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("new ArrayBuffer(8)").ref(),
      try runtime.eval("new Uint8Array(8)").ref()
    )
    let arrayBuffer = try JavaScriptArrayBuffer.decode(buffer.unownedValue(at: 0), in: runtime)
    #expect(arrayBuffer.size == 8)
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try JavaScriptArrayBuffer.decode(buffer.unownedValue(at: 1), in: runtime)
    }
  }

  @Test
  func `decoding rejects a value that is not an array buffer`() throws {
    for source in ["new Uint8Array(4)", "({})", "42"] {
      let value = try runtime.eval(source)
      #expect(throws: JavaScriptValue.TypeError.self) {
        _ = try JavaScriptArrayBuffer.decode(value, in: runtime)
      }
    }
  }

  @Test
  func `decodable kinds are objects`() {
    #expect(JavaScriptArrayBuffer.decodableKinds == .object)
  }

  @Test
  func `decoding rejects a runtime-free value`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try JavaScriptArrayBuffer.decode(JavaScriptValue.number(42), in: runtime)
    }
  }
}
