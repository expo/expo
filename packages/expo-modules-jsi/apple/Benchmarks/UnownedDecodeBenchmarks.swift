// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Decoding from a borrowed `JavaScriptUnownedValue`, the path a `@JS` argument takes, and from an owning
/// `JavaScriptValue`, the path a nested value takes. A type without its own unowned decode copies the
/// value into an owning `JavaScriptValue` first.
extension JSIBenchmarks {
  @Test
  func `unowned decode of an array`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("[1, 2, 3, 4, 5, 6, 7, 8]").ref()
      )
      try benchmark("[Double].decode(unowned): 8 elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Double].decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of a dictionary`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("({ a: 1, b: 2, c: 3, d: 4 })").ref()
      )
      try benchmark("[String: Double].decode(unowned): 4 entries", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [String: Double].decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of a date`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("1700000000000").ref())
      try benchmark("Date.decode(unowned): number", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Date.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `owning decode of an array`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("[1, 2, 3, 4, 5, 6, 7, 8]")
      try benchmark("[Double].decode(owning): 8 elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [Double].decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `owning decode of a dictionary`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("({ a: 1, b: 2, c: 3, d: 4 })")
      try benchmark("[String: Double].decode(owning): 4 entries", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [String: Double].decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `owning decode of nested arrays`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("[[1, 2], [3, 4], [5, 6], [7, 8]]")
      try benchmark("[[Double]].decode(owning): 4 x 2 elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [[Double]].decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of nested arrays`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("[[1, 2], [3, 4], [5, 6], [7, 8]]").ref()
      )
      try benchmark("[[Double]].decode(unowned): 4 x 2 elements", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try [[Double]].decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of a date string`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("'2026-10-02T12:00:00Z'").ref())
      try benchmark("Date.decode(unowned): ISO string", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Date.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of a date object`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("new Date(1700000000000)").ref())
      try benchmark("Date.decode(unowned): Date object", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Date.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of a set`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])").ref()
      )
      try benchmark("Set<Int>.decode(unowned): JS Set of 10", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Set<Int>.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of data`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(
        in: runtime,
        with: try runtime.eval("new Uint8Array(16)").ref()
      )
      try benchmark("Data.decode(unowned): 16 bytes", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Data.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `unowned decode of a bigint`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("9007199254740993n").ref())
      try benchmark("Int64.decode(unowned): BigInt", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Int64.decode(buffer.unownedValue(at: 0), in: runtime)
        }
      }
    }
  }

  @Test
  func `owning decode of data`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("new Uint8Array(16)")
      try benchmark("Data.decode(owning): 16 bytes", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Data.decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `owning decode of a bigint`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("9007199254740993n")
      try benchmark("Int64.decode(owning): BigInt", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Int64.decode(value, in: runtime)
        }
      }
    }
  }
}
