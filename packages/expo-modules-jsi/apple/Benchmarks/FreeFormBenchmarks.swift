// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Benchmarks for the free-form (`Any`) conversions. Each pair compares the dedicated fast path for
/// `[String: Any]` against the generic path that converts through `Any` and casts, on the same
/// attributes-like object of string, number and boolean values.
extension JSIBenchmarks {
  private static let attributesSource = """
    ({ screen: 'home', build: 'release', region: 'eu', retries: 3, latency: 12.5, cached: true, visible: false, count: 42 })
    """

  @Test
  func `decode free-form dictionary`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval(Self.attributesSource)
      try benchmark("JavaScriptValue.decodeAnyDictionary(_:in:)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptValue.decodeAnyDictionary(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `decode free-form dictionary through the generic path`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval(Self.attributesSource)
      try benchmark("JavaScriptValue.decodeAny(_:as: [String: Any].self, in:)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptValue.decodeAny(value, as: [String: Any].self, in: runtime)
        }
      }
    }
  }

  @Test
  func `encode free-form dictionary`() async throws {
    try await benchmarkCase { runtime in
      let attributes = try JavaScriptValue.decodeAnyDictionary(runtime.eval(Self.attributesSource), in: runtime)
      try benchmark("JavaScriptValue.encodeAnyDictionary(_:in:)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptValue.encodeAnyDictionary(attributes, in: runtime)
        }
      }
    }
  }

  @Test
  func `encode free-form dictionary through the generic path`() async throws {
    try await benchmarkCase { runtime in
      let attributes: Any = try JavaScriptValue.decodeAnyDictionary(runtime.eval(Self.attributesSource), in: runtime)
      try benchmark("JavaScriptValue.encodeAny(_:in:): [String: Any]", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptValue.encodeAny(attributes, in: runtime)
        }
      }
    }
  }
}
