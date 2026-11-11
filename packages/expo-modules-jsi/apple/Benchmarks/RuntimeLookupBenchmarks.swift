// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI
import Testing

/// Benchmarks for finding a runtime by the address of its `jsi::Runtime` with
/// ``JavaScriptRuntime/for(unsafePointer:)``: the runtime that the thread remembers, and a lookup in
/// the registry, which takes its lock. Alternating between two runtimes misses the remembered runtime
/// on every call.
extension JSIBenchmarks {
  @Test
  func `runtime lookup of the remembered runtime`() async throws {
    try await benchmarkCase { runtime in
      try runtime.withUnsafePointee { pointer in
        _ = JavaScriptRuntime.for(unsafePointer: pointer)
        try benchmark("JavaScriptRuntime.for(unsafePointer:): remembered", runtime: runtime) { iterations in
          for _ in 0..<iterations {
            _ = JavaScriptRuntime.for(unsafePointer: pointer)
          }
        }
      }
    }
  }

  @Test
  func `runtime lookup in the registry`() async throws {
    try await benchmarkCase { runtime in
      let other = JavaScriptRuntime()
      try runtime.withUnsafePointee { pointer in
        try other.withUnsafePointee { otherPointer in
          try benchmark("JavaScriptRuntime.for(unsafePointer:): registry", runtime: runtime) { iterations in
            for index in 0..<iterations {
              _ = JavaScriptRuntime.for(unsafePointer: index.isMultiple(of: 2) ? pointer : otherPointer)
            }
          }
        }
      }
    }
  }
}
