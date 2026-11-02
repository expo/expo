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

  @Test
  func `create and resolve deferred promise with a JavaScriptValue`() async throws {
    try await benchmarkCase { runtime in
      let object = runtime.createObject()
      let name = "JavaScriptPromise(runtime): create and resolve with JavaScriptValue"
      try benchmark(name, runtime: runtime) { iterations in
        for _ in 0..<iterations {
          let promise = try JavaScriptPromise(runtime)
          promise.resolve(object.asValue())
        }
      }
    }
  }

  @Test
  func `create and reject deferred promise`() async throws {
    try await benchmarkCase { runtime in
      let error = PromiseBenchmarkError()
      try benchmark("JavaScriptPromise(runtime): create and reject", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          let promise = try JavaScriptPromise(runtime)
          promise.reject(error)
        }
      }
    }
  }

  /// The full round trip of an async host function called from JavaScript: creating the promise,
  /// running the body and resolving the promise with its result.
  @Test
  func `async host function`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createAsyncFunction("asyncFn") { _, _ in
        return { .number(42) }
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchFn(); })").getFunction()
      try benchmark("async host function: resolve with a number", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  /// Wraps an existing JavaScript promise, as `JavaScriptCallback.invokeAsync` does for a returned
  /// promise.
  @Test
  func `wrap an existing promise`() async throws {
    try await benchmarkCase { runtime in
      let jsPromise = try runtime.eval("Promise.resolve(42)")
      try benchmark("JavaScriptPromise(runtime, object): wrap existing", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptPromise(runtime, jsPromise.getObject())
        }
      }
    }
  }
}

private struct PromiseBenchmarkError: Error {}
