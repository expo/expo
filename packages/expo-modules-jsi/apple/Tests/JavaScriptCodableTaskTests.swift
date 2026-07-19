// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@Suite("JavaScriptCodable+Task")
@JavaScriptActor
struct JavaScriptCodableTaskTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `encodes a task as a promise object`() throws {
    let task = Task<Int, any Error> {
      return 42
    }
    let encoded = try Task.encode(task, in: runtime)
    #expect(encoded.isObject())
  }

  @Test
  func `resolves with the encoded success value`() async throws {
    let task = Task<Int, any Error> {
      return 42
    }
    let result = try await Task.encode(task, in: runtime).getPromise().await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `resolves with a value produced after suspension`() async throws {
    let task = Task<String, any Error> {
      try await Task.sleep(nanoseconds: 10_000_000)  // 10ms
      return "done"
    }
    let result = try await Task.encode(task, in: runtime).getPromise().await()
    #expect(result.getString() == "done")
  }

  @Test
  func `rejects when the task throws`() async throws {
    struct TestError: Error {}
    let task = Task<Int, any Error> {
      throw TestError()
    }
    let promise = try Task.encode(task, in: runtime).getPromise()
    await #expect(throws: Error.self) {
      try await promise.await()
    }
  }

  @Test
  func `encodes a non-throwing task`() async throws {
    let task = Task<Int, Never> {
      return 7
    }
    let result = try await Task.encode(task, in: runtime).getPromise().await()
    #expect(result.getInt() == 7)
  }

  @Test
  func `encodes a task whose success is itself codable`() async throws {
    let task = Task<[String: Int], any Error> {
      return ["answer": 42]
    }
    let result = try await Task.encode(task, in: runtime).getPromise().await()
    #expect(result.getObject().getProperty("answer").getInt() == 42)
  }

  @Test
  func `encodes a task nested inside a container`() async throws {
    // The motivating case: a promise handed to JS as a *value* rather than a function's own return.
    let tasks = [
      Task<Int, any Error> { return 1 },
      Task<Int, any Error> { return 2 },
    ]
    let encoded = try [Task<Int, any Error>].encode(tasks, in: runtime)
    let array = encoded.getArray()
    #expect(array.length == 2)
    let first = try await array.getValue(at: 0).getPromise().await()
    let second = try await array.getValue(at: 1).getPromise().await()
    #expect(first.getInt() == 1)
    #expect(second.getInt() == 2)
  }
}
