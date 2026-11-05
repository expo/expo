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
  func `encode an Array of doubles`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let array = (0..<count).map { Double($0) + 0.5 }
      try benchmark("[Double].encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Double].encode(array, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `encode an Array of bools`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let array = (0..<count).map { $0 % 2 == 0 }
      try benchmark("[Bool].encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Bool].encode(array, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `encode an Array of strings`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let array = (0..<count).map { "item \($0)" }
      try benchmark("[String].encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [String].encode(array, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `encode an Array of optional ints`(count: Int) async throws {
    try await benchmarkCase { runtime in
      let array: [Int?] = (0..<count).map { $0 % 2 == 0 ? $0 : nil }
      try benchmark("[Int?].encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Int?].encode(array, in: runtime)
        }
      }
    }
  }

  @Test(arguments: [10, 1000])
  func `encode an Array through the default slot encode`(count: Int) async throws {
    // `DefaultEncodedNumber` has no `encode(_:into:in:)`, so this measures the default implementation.
    try await benchmarkCase { runtime in
      let array = (0..<count).map { DefaultEncodedNumber(value: Double($0)) }
      try benchmark("[DefaultEncodedNumber].encode: \(count) elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [DefaultEncodedNumber].encode(array, in: runtime)
        }
      }
    }
  }

  @Test
  func `encode nested arrays of ints`() async throws {
    try await benchmarkCase { runtime in
      let arrays = (0..<10).map { row in (0..<10).map { row * 10 + $0 } }
      try benchmark("[[Int]].encode: 10 x 10 elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [[Int]].encode(arrays, in: runtime)
        }
      }
    }
  }

  @Test
  func `encode a dictionary of ints`() async throws {
    try await benchmarkCase { runtime in
      let dictionary = Dictionary(uniqueKeysWithValues: (0..<10).map { ("key\($0)", $0) })
      try benchmark("[String: Int].encode: 10 entries", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [String: Int].encode(dictionary, in: runtime)
        }
      }
    }
  }

  @Test
  func `encode an array of dictionaries`() async throws {
    try await benchmarkCase { runtime in
      let dictionaries = (0..<10).map { index in ["a": index, "b": index + 1, "c": index + 2, "d": index + 3] }
      try benchmark("[[String: Int]].encode: 10 x 4 entries", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [[String: Int]].encode(dictionaries, in: runtime)
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

/// Encodes as a number through the default `encode(_:into:in:)`.
private struct DefaultEncodedNumber: JavaScriptEncodable {
  let value: Double

  static func encode(_ value: DefaultEncodedNumber, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .number(value.value)
  }
}
