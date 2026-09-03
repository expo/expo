// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Benchmarks for the places where strings cross between the engine and Swift outside of plain
/// `getString()`: property name enumeration, the `JavaScriptRepresentable` conformance of `String`,
/// and `JavaScriptPropNameID`. Each one isolates a single conversion so regressions can be
/// attributed precisely.
extension JSIBenchmarks {
  // MARK: - Property names

  @Test
  func `property names of an object with ASCII keys`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval(
        "({ alpha: 1, beta: 2, gamma: 3, delta: 4, epsilon: 5, zeta: 6, eta: 7, theta: 8, iota: 9, kappa: 10 })"
      ).getObject()
      try benchmark("JavaScriptObject.getPropertyNames(): 10 ASCII keys", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getPropertyNames()
        }
      }
    }
  }

  @Test
  func `property names of an object with non-ASCII keys`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval(
        "({ 'ąlpha': 1, 'bęta': 2, 'gąmma': 3, 'dęlta': 4, 'ępsilon': 5, 'zęta': 6, 'ęta': 7, 'thęta': 8, 'iotą': 9, 'kąppa': 10 })"
      ).getObject()
      try benchmark("JavaScriptObject.getPropertyNames(): 10 non-ASCII keys", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getPropertyNames()
        }
      }
    }
  }

  // MARK: - Property access by name

  @Test
  func `object property by non-ASCII name`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ 'odpowiedź': 42 })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:): non-ASCII name", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty("odpowiedź")
        }
      }
    }
  }

  @Test
  func `has object property by name`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 42 })").getObject()
      try benchmark("JavaScriptObject.hasProperty(_:)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.hasProperty("answer")
        }
      }
    }
  }

  @Test
  func `set object property by name`() async throws {
    try await benchmarkCase { runtime in
      let object = JavaScriptObject(runtime)
      try benchmark("JavaScriptObject.setProperty(_:value:): double", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          object.setProperty("answer", value: 42.0)
        }
      }
    }
  }

  // MARK: - String as JavaScriptRepresentable

  @Test
  func `string from JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'benchmark string value'")
      try benchmark("String.fromJavaScriptValue(): 22B ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = String.fromJavaScriptValue(value)
        }
      }
    }
  }

  @Test
  func `256B string from JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'a'.repeat(256)")
      try benchmark("String.fromJavaScriptValue(): 256B ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = String.fromJavaScriptValue(value)
        }
      }
    }
  }

  @Test
  func `non-ASCII string from JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'ąęó'.repeat(4)")
      try benchmark("String.fromJavaScriptValue(): 12 non-ASCII chars", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = String.fromJavaScriptValue(value)
        }
      }
    }
  }

  /// Sizes below the 512-code-unit threshold, where UTF-16 is transcoded by hand instead of by
  /// `String(decoding:as:)`.
  @Test
  func `64 non-ASCII chars from JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'zażółć gęślą jaźń '.repeat(4).slice(0, 64)")
      try benchmark("String.fromJavaScriptValue(): 64 non-ASCII chars", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = String.fromJavaScriptValue(value)
        }
      }
    }
  }

  @Test
  func `256 non-ASCII chars from JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'zażółć gęślą jaźń '.repeat(16).slice(0, 256)")
      try benchmark("String.fromJavaScriptValue(): 256 non-ASCII chars", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = String.fromJavaScriptValue(value)
        }
      }
    }
  }

  @Test
  func `128 emoji from JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("'🎉'.repeat(128)")
      try benchmark("String.fromJavaScriptValue(): 128 emoji (256 code units)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = String.fromJavaScriptValue(value)
        }
      }
    }
  }

  @Test
  func `string to JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let string = "benchmark string value"
      try benchmark("String.toJavaScriptValue(in:): 22B ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = string.toJavaScriptValue(in: runtime)
        }
      }
    }
  }

  @Test
  func `256B string to JavaScriptValue via JavaScriptRepresentable`() async throws {
    try await benchmarkCase { runtime in
      let string = String(repeating: "a", count: 256)
      try benchmark("String.toJavaScriptValue(in:): 256B ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = string.toJavaScriptValue(in: runtime)
        }
      }
    }
  }

  @Test
  func `string dictionary from JavaScriptValue`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval(
        """
        ({ alpha: 'one', beta: 'two', gamma: 'three', delta: 'four', epsilon: 'five',
           zeta: 'six', eta: 'seven', theta: 'eight', iota: 'nine', kappa: 'ten' })
        """
      )
      try benchmark("[String: String].fromJavaScriptValue(): 10 entries", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = [String: String].fromJavaScriptValue(value)
        }
      }
    }
  }

  // MARK: - PropNameID

  @Test
  func `PropNameID to string`() async throws {
    try await benchmarkCase { runtime in
      let propName = JavaScriptPropNameID(runtime, string: "propertyName")
      try benchmark("JavaScriptPropNameID.utf8(): ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = propName.utf8()
        }
      }
    }
  }

  @Test
  func `non-ASCII PropNameID to string`() async throws {
    try await benchmarkCase { runtime in
      let propName = JavaScriptPropNameID(runtime, string: "właściwość")
      try benchmark("JavaScriptPropNameID.utf8(): non-ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = propName.utf8()
        }
      }
    }
  }

  @Test
  func `PropNameID to string via utf16`() async throws {
    try await benchmarkCase { runtime in
      let propName = JavaScriptPropNameID(runtime, string: "propertyName")
      try benchmark("JavaScriptPropNameID.utf16(): ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = propName.utf16()
        }
      }
    }
  }

  @Test
  func `PropNameID from string`() async throws {
    try await benchmarkCase { runtime in
      let string = "propertyName"
      try benchmark("JavaScriptPropNameID(runtime, string:): ASCII", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = JavaScriptPropNameID(runtime, string: string)
        }
      }
    }
  }
}
