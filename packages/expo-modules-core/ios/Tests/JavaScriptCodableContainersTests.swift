// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+Containers")
@JavaScriptActor
struct JavaScriptCodableContainersTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - Array

  @Test
  func `decodes an array of ints`() throws {
    let runtime = try runtime
    let decoded = try [Int].decode(runtime.eval("[1, 2, 3]"), appContext: appContext, runtime: runtime)
    #expect(decoded == [1, 2, 3])
  }

  @Test
  func `encodes an array of strings`() throws {
    let runtime = try runtime
    let encoded = try [String].encode(["a", "b"], appContext: appContext, runtime: runtime)
    let array = encoded.getArray()
    #expect(array.length == 2)
    #expect(try array.getValue(at: 0).getString() == "a")
    #expect(try array.getValue(at: 1).getString() == "b")
  }

  @Test
  func `round-trips a nested array`() throws {
    let runtime = try runtime
    let decoded = try [[Double]].decode(runtime.eval("[[1.5], [2.5, 3.5]]"), appContext: appContext, runtime: runtime)
    #expect(decoded == [[1.5], [2.5, 3.5]])
  }

  @Test
  func `round-trips an empty array`() throws {
    let runtime = try runtime
    #expect(try [Int].decode(runtime.eval("[]"), appContext: appContext, runtime: runtime) == [])
    #expect(try [Int].encode([], appContext: appContext, runtime: runtime).getArray().length == 0)
  }

  @Test
  func `arrayizes a non-array scalar, matching v1`() throws {
    // v1 `DynamicArrayType` wraps a non-array value into a single-element array.
    let runtime = try runtime
    #expect(try [Int].decode(runtime.eval("42"), appContext: appContext, runtime: runtime) == [42])
  }

  // MARK: - Optional

  @Test
  func `decodes a present and absent optional`() throws {
    let runtime = try runtime
    #expect(try Int?.decode(runtime.eval("42"), appContext: appContext, runtime: runtime) == 42)
    #expect(try Int?.decode(runtime.eval("null"), appContext: appContext, runtime: runtime) == nil)
    #expect(try Int?.decode(runtime.eval("undefined"), appContext: appContext, runtime: runtime) == nil)
  }

  @Test
  func `encodes a present optional and nil as null`() throws {
    let runtime = try runtime
    #expect(try Int?.encode(7, appContext: appContext, runtime: runtime).getInt() == 7)
    #expect(try Int?.encode(nil, appContext: appContext, runtime: runtime).isNull() == true)
  }

  @Test
  func `decodes an array of optionals`() throws {
    let runtime = try runtime
    let decoded = try [Int?].decode(runtime.eval("[1, null, 3]"), appContext: appContext, runtime: runtime)
    #expect(decoded == [1, nil, 3])
  }

  // MARK: - Dictionary

  @Test
  func `decodes a string-keyed dictionary`() throws {
    let runtime = try runtime
    let decoded = try [String: Int].decode(runtime.eval("({ a: 1, b: 2 })"), appContext: appContext, runtime: runtime)
    #expect(decoded == ["a": 1, "b": 2])
  }

  @Test
  func `encodes a string-keyed dictionary`() throws {
    let runtime = try runtime
    let encoded = try [String: Int].encode(["x": 9], appContext: appContext, runtime: runtime)
    #expect(encoded.getObject().getProperty("x").getInt() == 9)
  }

  @Test
  func `round-trips an empty dictionary`() throws {
    let runtime = try runtime
    #expect(try [String: Int].decode(runtime.eval("({})"), appContext: appContext, runtime: runtime) == [:])
    let encoded = try [String: Int].encode([:], appContext: appContext, runtime: runtime)
    #expect(encoded.getObject().getPropertyNames().isEmpty)
  }

  @Test
  func `decode skips undefined-valued properties, matching v1`() throws {
    // An `undefined`-valued property is treated as absent rather than decoded (which would throw
    // for a non-optional value), matching the v1 dictionary converter.
    let runtime = try runtime
    let decoded = try [String: Int].decode(
      runtime.eval("({ a: 1, b: undefined })"), appContext: appContext, runtime: runtime)
    #expect(decoded == ["a": 1])
  }

  // MARK: - Zero-copy borrowed-value overload

  @Test
  func `decodes an optional from a borrowed value, present and absent`() throws {
    let runtime = try runtime
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 7, JavaScriptValue.null, JavaScriptValue.undefined)
    #expect(try Int?.decode(buffer.unownedValue(at: 0), appContext: appContext, runtime: runtime) == 7)
    #expect(try Int?.decode(buffer.unownedValue(at: 1), appContext: appContext, runtime: runtime) == nil)
    #expect(try Int?.decode(buffer.unownedValue(at: 2), appContext: appContext, runtime: runtime) == nil)
  }

}
