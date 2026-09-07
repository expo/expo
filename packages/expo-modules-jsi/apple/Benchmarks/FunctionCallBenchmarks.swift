// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Benchmarks for Swift calling into JavaScript functions, the opposite direction
/// of the host function benchmarks. Each operation covers encoding the arguments,
/// the engine's function invocation, and wrapping the returned value.
extension JSIBenchmarks {
  @Test
  func `call noop JS function`() async throws {
    try await benchmarkCase { runtime in
      let fn = try runtime.eval("(function() {})").getFunction()
      try benchmark("JavaScriptFunction.call(): noop", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try fn.call()
        }
      }
    }
  }

  @Test
  func `call JS function with two numbers`() async throws {
    try await benchmarkCase { runtime in
      let fn = try runtime.eval("(function(a, b) { return a + b; })").getFunction()
      try benchmark("JavaScriptFunction.call(): add two numbers", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try fn.call(arguments: 3.5, 38.5)
        }
      }
    }
  }

  @Test
  func `call JS function with two strings`() async throws {
    try await benchmarkCase { runtime in
      let fn = try runtime.eval("(function(a, b) { return a + b; })").getFunction()
      try benchmark("JavaScriptFunction.call(): concat two strings", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try fn.call(arguments: "expo ", "modules")
        }
      }
    }
  }
}
