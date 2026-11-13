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

  @Test
  func `call JS function with two numbers through emplace`() async throws {
    try await benchmarkCase { runtime in
      let fn = try runtime.eval("(function(a, b) { return a + b; })").getFunction()
      let check = try fn.call(argumentCount: 2) { buffer, runtime in
        try buffer.emplace(3.5, at: 0, in: runtime)
        try buffer.emplace(38.5, at: 1, in: runtime)
      }
      #expect(try check.asDouble() == 42)
      try benchmark("JavaScriptFunction.call(argumentCount:emplacing:): add two numbers", runtime: runtime) {
        iterations in
        for _ in 0..<iterations {
          _ = try fn.call(argumentCount: 2) { buffer, runtime in
            try buffer.emplace(3.5, at: 0, in: runtime)
            try buffer.emplace(38.5, at: 1, in: runtime)
          }
        }
      }
      try benchmark(
        "JavaScriptFunction.call(argumentCount:emplacing:): add two numbers, encoded by the caller",
        runtime: runtime
      ) { iterations in
        for _ in 0..<iterations {
          _ = try fn.call(argumentCount: 2) { buffer, runtime in
            buffer.emplace(try Double.encode(3.5, in: runtime), at: 0)
            buffer.emplace(try Double.encode(38.5, in: runtime), at: 1)
          }
        }
      }
    }
  }

  @Test
  func `call JS function with two strings through emplace`() async throws {
    try await benchmarkCase { runtime in
      let fn = try runtime.eval("(function(a, b) { return a + b; })").getFunction()
      let check = try fn.call(argumentCount: 2) { buffer, runtime in
        try buffer.emplace("expo ", at: 0, in: runtime)
        try buffer.emplace("modules", at: 1, in: runtime)
      }
      #expect(try check.asString() == "expo modules")
      try benchmark("JavaScriptFunction.call(argumentCount:emplacing:): concat two strings", runtime: runtime) {
        iterations in
        for _ in 0..<iterations {
          _ = try fn.call(argumentCount: 2) { buffer, runtime in
            try buffer.emplace("expo ", at: 0, in: runtime)
            try buffer.emplace("modules", at: 1, in: runtime)
          }
        }
      }
      try benchmark(
        "JavaScriptFunction.call(argumentCount:emplacing:): concat two strings, encoded by the caller",
        runtime: runtime
      ) { iterations in
        for _ in 0..<iterations {
          _ = try fn.call(argumentCount: 2) { buffer, runtime in
            buffer.emplace(try String.encode("expo ", in: runtime), at: 0)
            buffer.emplace(try String.encode("modules", in: runtime), at: 1)
          }
        }
      }
    }
  }
}
