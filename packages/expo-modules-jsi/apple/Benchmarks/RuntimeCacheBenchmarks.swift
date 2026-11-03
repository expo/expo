// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

private let answerPropNameKey = JavaScriptRuntime.Cache.Key<JavaScriptPropNameID>()

/// Benchmarks for values cached per runtime with ``JavaScriptRuntime/cached(_:_:)``, read against
/// the string-keyed ``JavaScriptPropNameID/cached(_:_:)`` registry.
extension JSIBenchmarks {
  @Test
  func `runtime cache hit`() async throws {
    try await benchmarkCase { runtime in
      _ = runtime.cached(answerPropNameKey) { JavaScriptPropNameID(runtime, string: "answer") }
      try benchmark("JavaScriptRuntime.cached(_:_:): hit", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = runtime.cached(answerPropNameKey) { JavaScriptPropNameID(runtime, string: "answer") }
        }
      }
    }
  }

  @Test
  func `object property by runtime-cached PropNameID`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 42 })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:): runtime-cached PropNameID", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty(runtime.cached(answerPropNameKey) { JavaScriptPropNameID(runtime, string: "answer") })
        }
      }
    }
  }

  @Test
  func `string-keyed PropNameID cache hit`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptPropNameID.cached(_:_:): hit", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = JavaScriptPropNameID.cached(runtime, "answer")
        }
      }
    }
  }

  @Test
  func `object property by string-keyed cached PropNameID`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 42 })").getObject()
      try benchmark("JavaScriptObject.getProperty(_:): string-cached PropNameID", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty(.cached(runtime, "answer"))
        }
      }
    }
  }

  @Test
  func `object property by prebuilt PropNameID`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 42 })").getObject()
      let propName = JavaScriptPropNameID(runtime, string: "answer")
      try benchmark("JavaScriptObject.getProperty(_:): prebuilt PropNameID", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.getProperty(propName)
        }
      }
      withExtendedLifetime(propName) {}
    }
  }
}
