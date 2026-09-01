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
}
