import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptValuesBufferTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `allocate with values populates count and subscript`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 1, "two", true)
    #expect(buffer.count == 3)
    #expect(try buffer[0].asInt() == 1)
    #expect(try buffer[1].asString() == "two")
    #expect(try buffer[2].asBool() == true)
  }

  @Test
  func `empty buffer has zero count and deinits cleanly`() {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 0)
    #expect(buffer.count == 0)
    // Deinit running cleanly is the assertion — no crash on deallocate of an empty buffer.
  }

  @Test
  func `copy produces an independent buffer with the same values`() throws {
    let original = JavaScriptValuesBuffer.allocate(in: runtime, with: 42, "hello")
    let duplicate = original.copy()

    #expect(duplicate.count == original.count)
    #expect(try duplicate[0].asInt() == 42)
    #expect(try duplicate[1].asString() == "hello")
  }

  @Test
  func `map enumerates values in order`() {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 1, 2, 3)
    let values = buffer.map { value, _ in (try? value.asInt()) ?? 0 }
    #expect(values == [1, 2, 3])
  }

  @Test
  func `does not leak the JS object referenced as an argument`() throws {
    // Regression test for a bug where `JavaScriptValuesBuffer.deinit` deallocated
    // the underlying memory without first running the destructors of the contained
    // `jsi::Value`s, leaking each value's strong ref to its JS object. Calling any
    // JS function via `JavaScriptValuesBuffer` would silently leak its arguments.
    let object = runtime.createObject()
    let weak = object.createWeak()

    // Allocate a buffer that captures the JS object as an argument; the result is
    // discarded and `deinit` runs at the end of this statement. If `deinit` skipped
    // `deinitialize`, the contained `jsi::Value` would still hold a strong ref and
    // the weak handle would survive `gc()`.
    _ = JavaScriptValuesBuffer.allocate(in: runtime, with: object.asValue())
    _ = consume object

    try runtime.eval("gc() && gc() && gc()")

    let stillAlive = weak.lock() != nil
    #expect(stillAlive == false)
  }
}
