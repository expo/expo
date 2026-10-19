// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Micro benchmarks for converting and accessing JavaScript values from Swift.
/// Each one isolates a single accessor so regressions can be attributed precisely.
extension JSIBenchmarks {
  @Test
  func `value to object`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("({ answer: 42 })")
      try benchmark("JavaScriptValue.getObject()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.getObject()
        }
      }
    }
  }

  @Test
  func `value to array`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("[1, 2, 3, 4, 5]")
      try benchmark("JavaScriptValue.getArray()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.getArray()
        }
      }
    }
  }

  @Test
  func `value to string`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'benchmark string value'")
      try benchmark("JavaScriptValue.getString()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.getString()
        }
      }
    }
  }

  /// A string short enough for Swift to store inline, so the read doesn't allocate.
  @Test
  func `value to short string`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'benchmark'")
      try benchmark("JavaScriptValue.getString(): 9B ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.getString()
        }
      }
    }
  }

  @Test
  func `unowned value to string`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("'benchmark string value'").ref()
      )
      try benchmark("JavaScriptUnownedValue.getString()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = buffer.unownedValue(at: 0).getString()
        }
      }
    }
  }

  @Test
  func `unowned decode of a string`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("'benchmark string value'").ref()
      )
      try benchmark("String.decode(unowned)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try String.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `value to double`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("123.45")
      try benchmark("JavaScriptValue.getDouble()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.getDouble()
        }
      }
    }
  }

  @Test
  func `object property by name`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 42 })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer")
        }
      }
    }
  }

  /// Unlike a number, a string or object property is a pointer value: wrapping it in a
  /// ``JavaScriptValue`` must not clone the engine handle it already owns.
  @Test
  func `object string property by name`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 'forty-two' })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:): string value", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer")
        }
      }
    }
  }

  @Test
  func `object object property by name`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: { value: 42 } })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:): object value", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer")
        }
      }
    }
  }

  // The conversions below run on a temporary, so the engine value can be moved into the wrapper
  // instead of cloned. Read them against `JavaScriptObject.getProperty(_:): object value` above.

  @Test
  func `object property to object`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: { value: 42 } })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:).getObject()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer").getObject()
        }
      }
    }
  }

  @Test
  func `object property to array`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: [1, 2, 3] })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:).getArray()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer").getArray()
        }
      }
    }
  }

  @Test
  func `object property to function`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer() {} })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:).getFunction()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer").getFunction()
        }
      }
    }
  }

  @Test
  func `object property to array buffer`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: new ArrayBuffer(8) })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:).getArrayBuffer()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer").getArrayBuffer()
        }
      }
    }
  }

  @Test
  func `object property to typed array`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: new Uint8Array(8) })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:).getTypedArray()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("answer").getTypedArray()
        }
      }
    }
  }

  @Test
  func `function to object`() async throws {
    try await benchmarkCase { runtime in
      let function = try runtime.eval("(function answer() {})").getFunction()
      try benchmark("JavaScriptFunction.asObject()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = function.asObject()
        }
      }
    }
  }

  @Test
  func `nested property traversal`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ a: { b: { c: { d: 42 } } } })").getObject()
      try benchmark("JavaScriptObject nested subscript (4 keys)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object["a", "b", "c", "d"]
        }
      }
    }
  }

  @Test
  func `property names enumeration`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval(
        "({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 })"
      ).getObject()
      try benchmark("JavaScriptObject.getPropertyNames() (8 properties)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getPropertyNames()
        }
      }
    }
  }

  @Test
  func `array element access`() async throws {
    try await benchmarkCase { runtime in
      let array = try runtime.eval("[1, 2, 3, 4, 5]").getArray()
      try benchmark("JavaScriptArray.getValue(at:)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try array.getValue(at: 0)
        }
      }
    }
  }

  @Test
  func `define a property`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptObject.defineProperty(_:value:options:)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          let object = runtime.createObject()
          object.defineProperty("__expo_shared_object_id__", value: index, options: [.writable])
        }
      }
    }
  }

  @Test
  func `create an object`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptRuntime.createObject()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = runtime.createObject()
        }
      }
    }
  }
}
