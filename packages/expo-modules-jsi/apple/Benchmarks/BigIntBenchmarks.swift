// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Reading and creating BigInts. The runtime has a refcount side table (other objects hold it `weak`),
/// so a retain and release of the runtime on any of these paths takes the slow path and dominates the
/// result.
extension JSIBenchmarks {
  @Test
  func `value to bigint`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("9007199254740993n")
      try benchmark("JavaScriptValue.getBigInt()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.getBigInt()
        }
      }
    }
  }

  @Test
  func `owning decode of a bigint as Int64`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("9007199254740993n")
      try benchmark("Int64.decode(owning): BigInt", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Int64.decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `owning decode of a number as Int64`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("42")
      try benchmark("Int64.decode(owning): number", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Int64.decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `bigint from Int64`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptBigInt(runtime, fromInt64:)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          _ = JavaScriptBigInt(runtime, fromInt64: Int64(index))
        }
      }
    }
  }

  @Test
  func `bigint from UInt64`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptBigInt(runtime, fromUint64:)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          _ = JavaScriptBigInt(runtime, fromUint64: UInt64(index))
        }
      }
    }
  }

  @Test
  func `bigint from string`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptBigInt(runtime, string:): 30 digits", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptBigInt(runtime, string: "123456789012345678901234567890")
        }
      }
    }
  }

  @Test
  func `bigint from a short string`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptBigInt(runtime, string:): 2 digits", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptBigInt(runtime, string: "42")
        }
      }
    }
  }
}
