// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Benchmarks for creating and settling deferred promises from Swift. The engine floor is measured
/// from JavaScript for comparison, so the wrapper's own overhead can be read off directly.
extension JSIBenchmarks {
  @Test
  func `engine floor: new Promise from JavaScript`() async throws {
    try await benchmarkCase { runtime in
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) new Promise(function (a, b) {}); })"
      ).getFunction()
      try benchmark("engine floor: new Promise from JS", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `create deferred promise`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptPromise(runtime): create deferred", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptPromise(runtime)
        }
      }
    }
  }

  @Test
  func `create and resolve deferred promise`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptPromise(runtime): create and resolve", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          let promise = try JavaScriptPromise(runtime)
          promise.resolve(42.0)
        }
      }
    }
  }
}
