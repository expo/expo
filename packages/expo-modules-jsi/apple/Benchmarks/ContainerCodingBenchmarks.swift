// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Benchmarks comparing the `Array` and `Set` `JavaScriptCodable` conformances. `Set` decoding from a
/// JS array shares the `Array` fast path and adds only the hashing, while decoding from a JS `Set` and
/// encoding to one go through the global `Array.from` and `Set` constructor, so each case is measured
/// against its `Array` counterpart at a small and a large element count.
extension JSIBenchmarks {
  // MARK: - Decode

  @Test(arguments: [10, 1000])
  func `decode an array of ints as Array`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("Array.from({ length: \(count) }, (_, i) => i)")
      try benchmark("[Int].decode: JS array of \(count)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Int].decode(value, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `decode an array of ints as Set`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("Array.from({ length: \(count) }, (_, i) => i)")
      try benchmark("Set<Int>.decode: JS array of \(count)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Set<Int>.decode(value, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `decode a set of ints as Set`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("new Set(Array.from({ length: \(count) }, (_, i) => i))")
      try benchmark("Set<Int>.decode: JS Set of \(count)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Set<Int>.decode(value, in: runtime)
        }
      }
    }
  }

  // MARK: - Encode

  @Test(arguments: [10, 1000])
  func `encode an Array of ints`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let array = Array(0..<count)
      try benchmark("[Int].encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Int].encode(array, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `encode a Set of ints`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let set = Set(0..<count)
      try benchmark("Set<Int>.encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Set<Int>.encode(set, in: runtime)
        }
      }
    }
  }
}
