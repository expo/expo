// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@Suite("JavaScriptCodable+Set")
@JavaScriptActor
struct JavaScriptCodableSetTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `decodes a set of strings from a JS Set`() throws {
    let decoded = try Set<String>.decode(runtime.eval("new Set(['a', 'b'])"), in: runtime)
    #expect(decoded == ["a", "b"])
  }

  @Test
  func `decodes a set from a subclass of Set`() throws {
    let decoded = try Set<Int>.decode(runtime.eval("new (class extends Set {})([1, 2])"), in: runtime)
    #expect(decoded == [1, 2])
  }

  @Test
  func `arrayizes a non-set object into a single-element set`() throws {
    let decoded = try Set<[String: Int]>.decode(runtime.eval("({ a: 1 })"), in: runtime)
    #expect(decoded == [["a": 1]])
  }

  @Test
  func `decoding many sets leaves no helper on the global object`() throws {
    let runtime = JavaScriptRuntime()
    for _ in 0..<100 {
      _ = try Set<Int>.decode(runtime.eval("new Set([1, 2, 3])"), in: runtime)
    }
    // The only object the wrapper may leave on `globalThis` is the long-lived-objects anchor.
    let ownGlobals = try runtime.eval("Object.getOwnPropertyNames(globalThis).length").getInt()
    let freshGlobals = try JavaScriptRuntime().eval("Object.getOwnPropertyNames(globalThis).length").getInt()
    #expect(ownGlobals - freshGlobals <= 1)
  }

  @Test
  func `decodes a set from an array, collapsing duplicates`() throws {
    let decoded = try Set<Int>.decode(runtime.eval("[1, 2, 2, 3, 1]"), in: runtime)
    #expect(decoded == [1, 2, 3])
  }

  @Test
  func `arrayizes a non-array, non-set scalar into a set`() throws {
    #expect(try Set<Int>.decode(runtime.eval("42"), in: runtime) == [42])
  }

  @Test
  func `encodes a set to a JS Set`() throws {
    let encoded = try Set<Int>.encode([1, 2, 3], in: runtime)
    #expect(encoded.is("Set"))
    let object = encoded.getObject()
    #expect(object.getProperty("size").getInt() == 3)
    #expect(try object.callFunction("has", arguments: 2).getBool() == true)
    #expect(try object.callFunction("has", arguments: 4).getBool() == false)
  }

  @Test
  func `round-trips a set of sets`() throws {
    let value: Set<Set<String>> = [["a"], ["b", "c"]]
    let encoded = try Set<Set<String>>.encode(value, in: runtime)
    #expect(try Set<Set<String>>.decode(encoded, in: runtime) == value)
  }

  @Test
  func `round-trips an empty set`() throws {
    #expect(try Set<Int>.decode(runtime.eval("new Set()"), in: runtime) == [])
    let encoded = try Set<Int>.encode([], in: runtime)
    #expect(encoded.is("Set"))
    #expect(encoded.getObject().getProperty("size").getInt() == 0)
  }

  @Test
  func `set decode rejects an element of the wrong type`() throws {
    #expect(throws: (any Error).self) {
      try Set<Int>.decode(runtime.eval("new Set([1, 'a'])"), in: runtime)
    }
  }

  @Test
  func `set decode collapses distinct JS objects that decode to equal values`() throws {
    // JS `Set` compares objects by reference, so it holds both objects; Swift compares the decoded
    // dictionaries by value, so they collapse into one element.
    let decoded = try Set<[String: Int]>.decode(runtime.eval("new Set([{ a: 1 }, { a: 1 }, { b: 2 }])"), in: runtime)
    #expect(decoded == [["a": 1], ["b": 2]])
  }

  @Test
  func `encodes a set of dictionaries to a JS Set of distinct objects`() throws {
    let encoded = try Set<[String: Int]>.encode([["a": 1], ["b": 2]], in: runtime)
    runtime.global().setProperty("encodedSet", value: encoded)
    let summary = try runtime.eval(
      "Array.from(encodedSet, (entry) => JSON.stringify(entry)).sort().join(',')"
    )
    #expect(summary.getString() == #"{"a":1},{"b":2}"#)
  }

  @Test
  func `decodes a set argument and encodes a set result through a host function`() throws {
    let fn = runtime.createFunction("uppercased") { [self] _, arguments in
      let strings = try Set<String>.decode(arguments.unownedValue(at: 0), in: runtime)
      return try Set<String>.encode(Set(strings.map { $0.uppercased() }), in: runtime)
    }
    runtime.global().setProperty("uppercased", value: fn.asValue())
    let result = try runtime.eval(
      "const result = uppercased(new Set(['a', 'b']))",
      "result instanceof Set && result.size === 2 && result.has('A') && result.has('B')"
    )
    #expect(result.getBool() == true)
  }
}
