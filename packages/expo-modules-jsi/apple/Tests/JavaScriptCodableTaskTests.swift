// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

// `Task.encode` settles its promise from a detached task, so the runtime here needs a real thread
// for that settle to land on. A standalone `JavaScriptRuntime()` would run it inline on the
// cooperative thread, concurrently with whatever the test body is doing to the same runtime. Every
// call that touches the runtime runs through `runIsolated` for the same reason; `await()` itself is
// a plain Swift suspension and resumes on the thread that settled the promise.
@Suite("JavaScriptCodable+Task")
struct JavaScriptCodableTaskTests {
  @Test
  func `encodes a task as a promise object`() async throws {
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<Int, any Error> {
        return 42
      }
      let encoded = try Task.encode(task, in: runtime.runtime)
      #expect(encoded.isObject())
      return UncheckedSendable(value: try encoded.getPromise())
    }
    _ = try await promise.value.await()
  }

  @Test
  func `resolves with the encoded success value`() async throws {
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<Int, any Error> {
        return 42
      }
      return UncheckedSendable(value: try Task.encode(task, in: runtime.runtime).getPromise())
    }
    let result = try await promise.value.await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `resolves with a value produced after suspension`() async throws {
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<String, any Error> {
        try await Task.sleep(nanoseconds: 10_000_000) // 10ms
        return "done"
      }
      return UncheckedSendable(value: try Task.encode(task, in: runtime.runtime).getPromise())
    }
    let result = try await promise.value.await()
    #expect(result.getString() == "done")
  }

  @Test
  func `rejects when the task throws`() async throws {
    struct TestError: Error {}
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<Int, any Error> {
        throw TestError()
      }
      return UncheckedSendable(value: try Task.encode(task, in: runtime.runtime).getPromise())
    }
    await #expect(throws: Error.self) {
      try await promise.value.await()
    }
  }

  @Test
  func `encodes a non-throwing task`() async throws {
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<Int, Never> {
        return 7
      }
      return UncheckedSendable(value: try Task.encode(task, in: runtime.runtime).getPromise())
    }
    let result = try await promise.value.await()
    #expect(result.getInt() == 7)
  }

  @Test
  func `encodes a task whose success is itself codable`() async throws {
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<[String: Int], any Error> {
        return ["answer": 42]
      }
      return UncheckedSendable(value: try Task.encode(task, in: runtime.runtime).getPromise())
    }
    let result = try await promise.value.await()
    #expect(result.getObject().getProperty("answer").getInt() == 42)
  }

  @Test
  func `encodes a task nested inside a container`() async throws {
    // The motivating case: a promise handed to JS as a *value* rather than a function's own return.
    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promises = try await runtime.scheduler.runIsolated {
      let tasks = [
        Task<Int, any Error> { return 1 },
        Task<Int, any Error> { return 2 },
      ]
      let array = try [Task<Int, any Error>].encode(tasks, in: runtime.runtime).getArray()
      #expect(array.length == 2)
      return [
        UncheckedSendable(value: try array.getValue(at: 0).getPromise()),
        UncheckedSendable(value: try array.getValue(at: 1).getPromise()),
      ]
    }
    let first = try await promises[0].value.await()
    let second = try await promises[1].value.await()
    #expect(first.getInt() == 1)
    #expect(second.getInt() == 2)
  }
}
