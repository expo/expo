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
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("[1, 2, 3, 4, 5, 6, 7, 8]"))
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
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("({ a: 1, b: 2, c: 3, d: 4 })"))
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
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("1700000000000"))
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
}
