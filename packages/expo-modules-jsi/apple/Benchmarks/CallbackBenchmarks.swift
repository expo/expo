// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Benchmarks for calling a JavaScript function kept as a `JavaScriptCallback`, the path of events
/// and progress callbacks from native code. The calls are made on the JavaScript thread, so they run
/// inline and measure the wrapper's own overhead without a thread hop.
extension JSIBenchmarks {
  /// Creating a callback happens on every call of a function that takes a closure argument.
  @Test
  func `callback decode`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("(function () {})")
      try benchmark("JavaScriptCallback.decode(): create and drop", runtime: runtime) { iterations in
        try value.withUnownedValue(in: runtime) { unownedValue in
          for _ in 0..<iterations {
            _ = try JavaScriptCallback.decode(unownedValue, in: runtime)
          }
        }
      }
    }
  }

  @Test
  func `callback invokeDetached without arguments`() async throws {
    try await benchmarkCase { runtime in
      let callback = try makeBenchmarkCallback(runtime)
      try benchmark("JavaScriptCallback.invokeDetached(): no arguments", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          callback.invokeDetached()
        }
      }
    }
  }

  @Test
  func `callback invokeDetached with one argument`() async throws {
    try await benchmarkCase { runtime in
      let callback = try makeBenchmarkCallback(runtime)
      try benchmark("JavaScriptCallback.invokeDetached(): one argument", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          callback.invokeDetached(42.0)
        }
      }
    }
  }

  @Test
  func `callback invokeDetached with one string argument`() async throws {
    try await benchmarkCase { runtime in
      let callback = try makeBenchmarkCallback(runtime)
      try benchmark("JavaScriptCallback.invokeDetached(): one string argument", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          callback.invokeDetached("progress")
        }
      }
    }
  }

  @Test
  func `callback invokeDetached with three arguments`() async throws {
    try await benchmarkCase { runtime in
      let callback = try makeBenchmarkCallback(runtime)
      try benchmark("JavaScriptCallback.invokeDetached(): three arguments", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          callback.invokeDetached(42.0, true, 7.0)
        }
      }
    }
  }

  @Test
  func `callback invokeBlocking with one argument and a result`() async throws {
    try await benchmarkCase { runtime in
      let callback = try makeBenchmarkCallback(runtime, source: "(function (x) { return x; })")
      let name = "JavaScriptCallback.invokeBlocking(): one argument, Double result"
      try benchmark(name, runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try callback.invokeBlocking(42.0, returning: Double.self)
        }
      }
    }
  }
}

/// Decodes a callback the way generated bindings decode a closure argument.
@JavaScriptActor
private func makeBenchmarkCallback(
  _ runtime: JavaScriptRuntime,
  source: String = "(function () {})"
) throws -> JavaScriptCallback {
  let value = try runtime.eval(source)
  return try value.withUnownedValue(in: runtime) { unownedValue in
    try JavaScriptCallback.decode(unownedValue, in: runtime)
  }
}
