import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptPropNameIDTests {
  let runtime = JavaScriptRuntime()

  // MARK: - UTF-8 round-trip

  @Test
  func `round-trips an ASCII string`() {
    let propName = JavaScriptPropNameID(runtime, string: "length")
    #expect(propName.utf8() == "length")
  }

  // Regression test for the `forUtf8(pointer, length)` byte-count bug: `String.count` is the
  // grapheme-cluster count, not the UTF-8 byte count, so non-ASCII keys used to be truncated
  // (e.g. `"café"` reported 4 for its 5 UTF-8 bytes) and the PropNameID held mangled bytes.
  @Test(arguments: ["café", "naïve", "Ωμέγα", "日本語", "Grüße", "emoji 🎉", "over\u{2028}line"])
  func `round-trips a non-ASCII string via utf8`(key: String) {
    let propName = JavaScriptPropNameID(runtime, string: key)
    #expect(propName.utf8() == key)
  }

  // Multi-scalar grapheme clusters (ZWJ sequences, combining marks) have a `count` of 1 but many
  // UTF-8 bytes — the worst case for the old truncation.
  @Test(arguments: ["👨‍👩‍👧", "e\u{0301}", "🇵🇱"])
  func `round-trips a multi-scalar grapheme via utf8`(key: String) {
    let propName = JavaScriptPropNameID(runtime, string: key)
    #expect(propName.utf8() == key)
  }

  @Test(arguments: ["café", "日本語", "🎉"])
  func `round-trips a non-ASCII string via utf16`(key: String) {
    let propName = JavaScriptPropNameID(runtime, string: key)
    #expect(propName.utf16() == key)
  }

  @Test
  func `round-trips an empty string`() {
    let propName = JavaScriptPropNameID(runtime, string: "")
    #expect(propName.utf8() == "")
    #expect(propName.utf16() == "")
  }

  @Test
  func `round-trips a long non-ASCII string`() {
    let key = String(repeating: "ą", count: 2000)
    let propName = JavaScriptPropNameID(runtime, string: key)
    #expect(propName.utf8() == key)
    #expect(propName.utf16() == key)
  }

  // MARK: - Caching

  @Test
  func `cached returns the same instance for the same string`() {
    let first = JavaScriptPropNameID.cached(runtime, "café")
    let second = JavaScriptPropNameID.cached(runtime, "café")
    #expect(first === second)
  }

  @Test
  func `cached round-trips a non-ASCII string`() {
    let propName = JavaScriptPropNameID.cached(runtime, "café")
    #expect(propName.utf8() == "café")
  }

  // MARK: - Property resolution

  // End-to-end: a PropNameID built from a non-ASCII key must resolve the matching JS property.
  // With the truncation bug the mangled key missed the real property and returned `undefined`.
  @Test
  func `resolves a non-ASCII property by PropNameID`() throws {
    let object = try runtime.eval("({ 'café': 42, '日本語': 'ok', '🎉': true })").getObject()

    #expect(object.getProperty(JavaScriptPropNameID(runtime, string: "café")).getInt() == 42)
    #expect(object.getProperty(JavaScriptPropNameID(runtime, string: "日本語")).getString() == "ok")
    #expect(object.getProperty(JavaScriptPropNameID(runtime, string: "🎉")).getBool() == true)
  }

  @Test
  func `resolves a non-ASCII property that does not exist as undefined`() throws {
    let object = try runtime.eval("({ 'café': 42 })").getObject()

    // A different non-ASCII key must not collide with `café` via truncated bytes.
    #expect(object.getProperty(JavaScriptPropNameID(runtime, string: "caff")).isUndefined() == true)
    #expect(object.getProperty(JavaScriptPropNameID(runtime, string: "naïve")).isUndefined() == true)
  }

  @Test
  func `property type errors report the non-ASCII property name`() throws {
    let object = try runtime.eval("({ 'café': 42 })").getObject()
    let propName = JavaScriptPropNameID(runtime, string: "café")
    let notObject = #expect(throws: JavaScriptObject.PropertyNotObjectError.self) {
      try object.getPropertyAsObject(propName)
    }
    #expect(notObject?.description == "Property 'café' is not an object")
    let notFunction = #expect(throws: JavaScriptObject.PropertyNotFunctionError.self) {
      try object.getPropertyAsFunction(propName)
    }
    #expect(notFunction?.description == "Property 'café' is not a function")
  }

  // Second `forUtf8(pointer, length)` call site: the array's string-keyed subscript getter.
  @Test
  func `array string subscript reads a non-ASCII custom property`() throws {
    let array = try runtime.eval("(() => { const a = [10, 20]; a['café'] = 42; a['🎉'] = 'party'; return a; })()")
      .getArray()

    #expect(array["café"].getInt() == 42)
    #expect(array["🎉"].getString() == "party")
  }

  @Test
  func `array string subscript writes a non-ASCII custom property`() throws {
    let array = try runtime.eval("[1, 2]").getArray()
    array["café"] = JavaScriptValue(runtime, "party")
    runtime.global().setProperty("arr", value: array.asValue())
    #expect(try runtime.eval("arr['café'] === 'party'").getBool() == true)
  }
}
