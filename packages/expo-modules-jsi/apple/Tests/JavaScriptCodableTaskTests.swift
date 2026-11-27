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
      #expect(encoded.isObject() == true)
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
      _ = try await promise.value.await()
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
    // Reading the object touches the runtime, so it happens on the runtime's thread.
    let result = try await promise.value.await().ref()
    let answer = try await runtime.scheduler.runIsolated {
      try result.take().getObject().getProperty("answer").getInt()
    }
    #expect(answer == 42)
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

  @Test
  func `rejects and deregisters settler when encoding the task result throws`() async throws {
    struct FailingResult: JavaScriptEncodable {
      struct EncodeError: Error {}
      static func encode(_ value: FailingResult, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
        throw EncodeError()
      }
    }

    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<FailingResult, any Error> {
        return FailingResult()
      }
      return UncheckedSendable(value: try Task.encode(task, in: runtime.runtime).getPromise())
    }
    await #expect(throws: Error.self) {
      _ = try await promise.value.await()
    }
    // Only `promise` itself stays registered; `PromiseSettler` deregistered on settlement.
    let registeredCount = try await runtime.scheduler.runIsolated {
      runtime.runtime.longLivedObjects.count
    }
    #expect(registeredCount == 1)
  }

  @Test
  func `rejects with JavaScriptThrowable message and code`() async throws {
    struct TaskCodedError: JavaScriptThrowable {
      var message: String { "task boom" }
      var code: String { "ERR_TASK" }
    }

    let runtime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await runtime.scheduler.runIsolated {
      let task = Task<Int, any Error> {
        throw TaskCodedError()
      }
      let promiseValue = try Task.encode(task, in: runtime.runtime)
      runtime.runtime.global().setProperty("taskPromise", value: promiseValue)
      return UncheckedSendable(
        value: try runtime.runtime.eval(
          "globalThis.taskPromise.then(() => null, (e) => [e instanceof Error, e.message, e.code])"
        ).getPromise()
      )
    }
    let settled = try await promise.value.await().ref()
    try await runtime.scheduler.runIsolated {
      let array = try settled.take().getArray()
      #expect(array[0].getBool() == true)
      #expect(array[1].getString() == "task boom")
      #expect(array[2].getString() == "ERR_TASK")
      // Only `promise` (a wrapped promise) stays registered; the task's `PromiseSettler` deregistered.
      #expect(runtime.runtime.longLivedObjects.count == 1)
    }
  }

  @Test
  func `propagates promise construction failure without registering a settler`() async throws {
    let runtime = await TestRuntimeScheduler().makeRuntime()
    try await runtime.scheduler.runIsolated {
      try runtime.runtime.eval("globalThis.Promise = undefined")
      let task = Task<Int, any Error> {
        return 1
      }
      #expect(throws: Error.self) {
        _ = try Task.encode(task, in: runtime.runtime)
      }
      #expect(runtime.runtime.longLivedObjects.count == 0)
    }
  }

  @Test
  func `task completing after runtime teardown does not crash`() async throws {
    let gate = AsyncStream<Void>.makeStream()
    let task = Task<Int, any Error> {
      for await _ in gate.stream {
        break
      }
      return 42
    }

    do {
      let runtime = JavaScriptRuntime()
      try await encodeAndExpectOneLongLivedObject(task: task, in: runtime)
      // Leaving the scope destroys the runtime while `task` is still pending.
    }

    gate.continuation.yield()
    gate.continuation.finish()
    #expect(try await task.value == 42)
    // Allow `Task.encode`'s detached task to observe the completed result and bail out cleanly.
    try await Task.sleep(nanoseconds: 10_000_000)
  }

  @JavaScriptActor
  private func encodeAndExpectOneLongLivedObject(task: Task<Int, any Error>, in runtime: JavaScriptRuntime) throws {
    _ = try Task.encode(task, in: runtime)
    #expect(runtime.longLivedObjects.count == 1)
  }
}
