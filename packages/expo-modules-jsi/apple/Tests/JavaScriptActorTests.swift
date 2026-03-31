// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@Suite
struct JavaScriptActorTests {
  let runtime = JavaScriptRuntime()

  // MARK: - assumeIsolated

  @Test
  func `assumeIsolated executes operation synchronously`() {
    var executed = false
    JavaScriptActor.assumeIsolated {
      executed = true
    }
    #expect(executed == true)
  }

  @Test
  func `assumeIsolated returns value`() {
    let result = JavaScriptActor.assumeIsolated {
      return 42
    }
    #expect(result == 42)
  }

  @Test
  func `assumeIsolated returns string`() {
    let result = JavaScriptActor.assumeIsolated {
      return "test value"
    }
    #expect(result == "test value")
  }

  @Test
  func `assumeIsolated returns complex type`() {
    struct TestData {
      let name: String
      let value: Int
    }
    let result = JavaScriptActor.assumeIsolated {
      return TestData(name: "test", value: 100)
    }
    #expect(result.name == "test")
    #expect(result.value == 100)
  }

  @Test
  func `assumeIsolated throws error`() {
    struct CustomError: Error {}

    #expect(throws: CustomError.self) {
      try JavaScriptActor.assumeIsolated {
        throw CustomError()
      }
    }
  }

  @Test
  func `assumeIsolated can modify captured variables`() {
    var counter = 0
    JavaScriptActor.assumeIsolated {
      counter = 10
    }
    #expect(counter == 10)
  }

  @Test
  func `assumeIsolated can call other isolated functions`() {
    @JavaScriptActor
    func isolatedHelper() -> String {
      return "helper result"
    }

    let result = JavaScriptActor.assumeIsolated {
      return isolatedHelper()
    }
    #expect(result == "helper result")
  }

  @Test
  func `nested assumeIsolated calls work`() {
    let result = JavaScriptActor.assumeIsolated {
      return JavaScriptActor.assumeIsolated {
        return 42
      }
    }
    #expect(result == 42)
  }

  // MARK: - Integration with JavaScriptRuntime

  @Test
  @JavaScriptActor
  func `runtime eval works on JavaScriptActor`() throws {
    let value = try runtime.eval("21 + 21")
    #expect(value.getInt() == 42)
  }

  @Test
  @JavaScriptActor
  func `runtime operations are isolated`() throws {
    let obj = runtime.createObject()
    obj.setProperty("value", value: 100.0)

    let result = obj.getProperty("value").getInt()
    #expect(result == 100)
  }

  @Test
  func `assumeIsolated allows runtime operations`() throws {
    let result = try JavaScriptActor.assumeIsolated {
      let value = try runtime.eval("10 * 5")
      return value.getInt()
    }
    #expect(result == 50)
  }

  // MARK: - Execute tests

  @Test
  func `execute runs async operation in isolation`() async throws {
    // async outside, async inside
    try await runtime.execute {
      JavaScriptActor.assertIsolated()
      try await Task.sleep(nanoseconds: 0) // makes the closure async
      JavaScriptActor.assertIsolated()
    }
  }

  @Test
  func `execute runs async operation in isolation (blocking)`() throws {
    // sync outside, async inside
    try runtime.execute {
      JavaScriptActor.assertIsolated()
      try await Task.sleep(nanoseconds: 0) // makes the closure async
      JavaScriptActor.assertIsolated()
    }
  }

  @Test
  func `execute runs non-async operation in isolation`() throws {
    // sync outside, sync inside
    try runtime.execute {
      JavaScriptActor.assertIsolated()
    }
  }
}
