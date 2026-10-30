@_spi(Internal) import ExpoModulesJSI
import Foundation
import Testing

@Suite
@JavaScriptActor
struct JavaScriptRuntimeTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `get global`() {
    // Just check it does not crash
    _ = runtime.global()
  }

  @Test
  func `create plain object`() {
    _ = runtime.createObject()
  }

  @Test
  func `create object with prototype`() {
    let prototype = runtime.createObject()
    prototype.setProperty("test", value: 123)
    let object = runtime.createObject(prototype: prototype)
    #expect(object.getProperty("test").getDouble() == 123)
  }

  @Test
  func `create function`() {
    let fn = runtime.createFunction("function name") { this, arguments in
      return .undefined()
    }
    #expect(fn.asValue().isFunction() == true)
  }

  @Test
  func `host function returns a fresh string`() throws {
    let fn = runtime.createFunction("greet") { [runtime] _, _ in
      return JavaScriptValue(runtime, "hello")
    }
    runtime.global().setProperty("greet", value: fn)
    #expect(try runtime.eval("greet() + ' ' + greet()").getString() == "hello hello")
  }

  @Test
  func `host function returns a shared value repeatedly`() throws {
    // The same instance is returned on every call, so the host call must copy the engine handle
    // instead of moving it out: the captured value has to stay valid for the next call.
    let shared = JavaScriptValue(runtime, "shared")
    let fn = runtime.createFunction("shared") { _, _ in
      return shared.copy()
    }
    runtime.global().setProperty("shared", value: fn)
    #expect(try runtime.eval("shared() + ' ' + shared()").getString() == "shared shared")
    #expect(shared.getString() == "shared")
  }

  @Test
  func `host function returns an object it keeps`() throws {
    let kept = runtime.createObject()
    kept.setProperty("answer", value: 42)
    let fn = runtime.createFunction("kept") { _, _ in
      return kept.asValue()
    }
    runtime.global().setProperty("kept", value: fn)
    #expect(try runtime.eval("kept().answer + kept().answer").getInt() == 84)
    #expect(kept.getProperty("answer").getInt() == 42)
  }

  @Test
  func `evaluate script`() throws {
    #expect(try runtime.eval("'hello' + ' ' + 'world'").getString() == "hello world")
    #expect(try runtime.eval("(function() {})").isFunction() == true)
  }

  @Test
  func `evaluate multiline script`() throws {
    #expect(try runtime.eval("const expo = 'expo'", "expo + 'jsi'").getString() == "expojsi")
  }

  @Test
  func `evaluate throws on error`() {
    #expect(throws: ScriptEvaluationError.self) {
      _ = try runtime.eval("1 + *")
    }
  }

  @Test
  func `evaluate to promise`() async throws {
    let result = try await runtime.evalAsync("'hello'")
    #expect(result.getString() == "hello")
  }

  @Test
  func `evaluate to promise on the JavaScript thread when called from another thread`() async throws {
    // The test body runs on a cooperative thread, not on the scheduler's thread. Evaluating there
    // would run JavaScript concurrently with the work the scheduler runs, such as settling a promise.
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let runtime = testRuntime.runtime
    try await testRuntime.scheduler.runIsolated {
      let isOnJavaScriptThread = runtime.createFunction("isOnJavaScriptThread") { _, _ in
        return JavaScriptValue(runtime, runtime.isOnJavaScriptThread())
      }
      runtime.global().setProperty("isOnJavaScriptThread", value: isOnJavaScriptThread.asValue())
    }

    let result = try await runtime.evalAsync("Promise.resolve(isOnJavaScriptThread())")
    #expect(result.getBool() == true)
  }

  @Test
  func `is equatable`() {
    #expect((runtime == runtime) == true)
    #expect((runtime != JavaScriptRuntime()) == true)
  }

  @Test
  func `execute sync evaluates JavaScript from non-async context`() throws {
    let result = try runtime.execute {
      try self.runtime.eval("2 + 2").getInt()
    }
    #expect(result == 4)
  }

  @Test
  func `execute sync throws error from non-async context`() {
    #expect(throws: ScriptEvaluationError.self) {
      _ = try runtime.execute {
        try self.runtime.eval("1 + *")
      }
    }
  }

  @Test
  func `execute async returns value`() async throws {
    let result: String = try await runtime.execute {
      await Task.yield()
      return "hello"
    }
    #expect(result == "hello")
  }

  @Test
  func `execute async awaits JavaScript evaluation`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let result = try await runtime.execute {
        try await runtime.evalAsync("Promise.resolve('async result')").ref()
      }
      #expect(try await runtime.execute { try result.take().getString() } == "async result")
    }
  }

  @Test
  func `execute async returns a JavaScript value`() async throws {
    let result = try await runtime.execute {
      await Task.yield()
      return try self.runtime.eval("({ answer: 42 })")
    }
    #expect(result.getObject().getProperty("answer").getInt() == 42)
  }

  @Test
  func `execute async throws error`() async {
    await #expect(throws: ScriptEvaluationError.self) {
      _ = try await runtime.execute {
        await Task.yield()
        try self.runtime.eval("invalid syntax +++")
      }
    }
  }

  @Test
  func `execute async with operations`() async throws {
    let result = try await runtime.execute {
      await Task.yield()
      let obj = self.runtime.createObject()
      obj.setProperty("value", value: 100)
      return obj.getProperty("value").getInt()
    }
    #expect(result == 100)
  }

  @Test
  func `runOrSchedule runs inline on the JavaScript thread and schedules otherwise`() async {
    let scheduler = TestRuntimeScheduler()
    let owningRuntime = await scheduler.run {
      JavaScriptRuntime()
    }
    let runtime = await scheduler.run {
      owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: scheduler.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnTestRuntime, to: UnsafeRawPointer.self)
        )
      }
    }

    await scheduler.run {
      let didRunInline = InlineRunFlag()
      runtime.runOrSchedule {
        didRunInline.value = true
      }
      #expect(didRunInline.value)
    }

    await withCheckedContinuation { continuation in
      runtime.runOrSchedule {
        #expect(runtime.isOnJavaScriptThread())
        continuation.resume()
      }
    }

    // The wrapper borrows both the underlying JSI runtime and the scheduler context.
    withExtendedLifetime(runtime) {}
    withExtendedLifetime(owningRuntime) {}
    withExtendedLifetime(scheduler) {}
  }

  @Test
  func `schedule drops the work when the runtime is gone by the time it runs`() async {
    let scheduler = TestRuntimeScheduler()
    let owningRuntime = await scheduler.run {
      JavaScriptRuntime()
    }
    let didRun = InlineRunFlag()

    await scheduler.run {
      var runtime: JavaScriptRuntime? = owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: scheduler.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnTestRuntime, to: UnsafeRawPointer.self)
        )
      }
      // Queued behind this block, so it runs after the runtime below is gone.
      runtime?.schedule {
        didRun.value = true
      }
      runtime = nil
    }
    await scheduler.run {}

    #expect(didRun.value == false)
    withExtendedLifetime(owningRuntime) {}
    withExtendedLifetime(scheduler) {}
  }

  @Test(.timeLimit(.minutes(1)))
  func `execute throws RuntimeLostError when the host drops the task`() async throws {
    let testRuntime = await ReleasableTestRuntime(dispatch: dropOnTestRuntime)
    let runtime = try #require(testRuntime.runtime)

    // Called off the runtime's JavaScript thread, so each call schedules a task that the host drops.
    await #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      try await runtime.execute { 1 }
    }
    await #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      try await runtime.execute { () async in 1 }
    }
    // The blocking overloads aren't available in async contexts, so they run on a thread of their own.
    let blockingResults = await withCheckedContinuation { (continuation: CheckedContinuation<[Bool], Never>) in
      Thread.detachNewThread {
        continuation.resume(returning: [
          isRuntimeLostError { try runtime.execute { 1 } },
          isRuntimeLostError { try runtime.execute { () async in 1 } },
        ])
      }
    }
    #expect(blockingResults == [true, true])
    await testRuntime.tearDown()
  }

  // The execute<R> overloads have a same-thread fast path and a cross-thread path that
  // schedules the closure onto the JS thread and pumps the caller's run loop until it
  // completes. The tests above run on `@JavaScriptActor` (the JS thread), so they only
  // exercise the fast path. The next three hop off the JS thread first to cover the
  // cross-thread scheduling + run-loop pump. The sync overloads of `execute` are
  // `@available(*, noasync)`, so the caller must be a real synchronous thread — wrapping
  // in `Task.detached` would stay on the cooperative pool and trip the noasync diagnostic.

  @Test
  func `execute sync from off-thread caller`() async throws {
    let runtime = self.runtime
    let result = try await onSyncOffThread {
      try runtime.execute { @JavaScriptActor in
        return runtime.global().hasProperty("Object") ? 1 : 0
      }
    }
    #expect(result == 1)
  }

  @Test
  func `execute blocking-async from off-thread caller`() async throws {
    let runtime = self.runtime
    let result = try await onSyncOffThread {
      try runtime.execute { @JavaScriptActor () async in
        await Task.yield()
        return runtime.global().hasProperty("Object") ? 1 : 0
      }
    }
    #expect(result == 1)
  }

  @Test
  func `execute sync rethrows from off-thread caller`() async throws {
    let runtime = self.runtime
    await #expect(throws: ScriptEvaluationError.self) {
      try await onSyncOffThread {
        try runtime.execute { @JavaScriptActor in
          try runtime.eval("invalid syntax +++")
        }
      }
    }
  }

  // A standalone runtime runs scheduled work inline on the caller, so the next four tests give the
  // runtime its own thread with `TestRuntimeScheduler` to make the caller wait for it.

  @Test
  func `execute sync waits without spinning on a thread without run loop sources`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let runtime = testRuntime.runtime
    let cpuTime = try await onSyncOffThread {
      try measureThreadCPUTime {
        try runtime.execute { @JavaScriptActor in
          _ = usleep(200_000)
        }
      }
    }
    #expect(cpuTime < 0.05)
  }

  @Test
  func `execute blocking-async waits without spinning on a thread without run loop sources`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let runtime = testRuntime.runtime
    let cpuTime = try await onSyncOffThread {
      try measureThreadCPUTime {
        try runtime.execute { @JavaScriptActor () async in
          _ = usleep(200_000)
        }
      }
    }
    #expect(cpuTime < 0.05)
  }

  @Test
  func `execute sync returns as soon as a short task finishes`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let runtime = testRuntime.runtime
    let elapsed = try await onSyncOffThread {
      let start = ContinuousClock.now
      for _ in 0..<20 {
        try runtime.execute { @JavaScriptActor in }
      }
      return ContinuousClock.now - start
    }
    #expect(elapsed < .milliseconds(500))
  }

  @Test
  func `execute blocking-async returns as soon as a short task finishes`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let runtime = testRuntime.runtime
    let elapsed = try await onSyncOffThread {
      let start = ContinuousClock.now
      for _ in 0..<20 {
        try runtime.execute { @JavaScriptActor () async in }
      }
      return ContinuousClock.now - start
    }
    #expect(elapsed < .milliseconds(500))
  }

  // MARK: - Host objects

  @Test
  func `host object get property`() {
    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "foo" {
          return JavaScriptValue(self.runtime, 42)
        }
        return .undefined()
      },
      getPropertyNames: { ["foo"] }
    )

    #expect(hostObject.getProperty("foo").getInt() == 42)
    #expect(hostObject.getProperty("unknown").isUndefined() == true)
  }

  @Test
  func `host object getter returns strings`() throws {
    // `fresh` is created per access and gets moved into the result; `shared` is the same instance on
    // every access and has to be copied so it stays valid.
    let shared = JavaScriptValue(runtime, "shared")
    let hostObject = runtime.createHostObject(
      get: { [runtime] name in
        switch name {
        case "fresh":
          return JavaScriptValue(runtime, "fresh")
        case "shared":
          return shared.copy()
        default:
          return .undefined()
        }
      },
      getPropertyNames: { ["fresh", "shared"] }
    )
    runtime.global().setProperty("host", value: hostObject)

    #expect(try runtime.eval("host.fresh + host.fresh").getString() == "freshfresh")
    #expect(try runtime.eval("host.shared + host.shared").getString() == "sharedshared")
    #expect(shared.getString() == "shared")
  }

  @Test
  func `host object set property`() {
    var storedValue: Int?

    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "value", let storedValue {
          return JavaScriptValue(self.runtime, storedValue)
        }
        return .undefined()
      },
      set: { name, value in
        if name == "value" {
          storedValue = value.getInt()
        }
      },
      getPropertyNames: { ["value"] }
    )

    hostObject.setProperty("value", value: 99)
    #expect(storedValue == 99)
    #expect(hostObject.getProperty("value").getInt() == 99)
  }

  @Test
  func `host object property names`() throws {
    let hostObject = runtime.createHostObject(
      get: { name in
        switch name {
        case "a": return JavaScriptValue(self.runtime, 1)
        case "b": return JavaScriptValue(self.runtime, 2)
        default: return .undefined()
        }
      },
      getPropertyNames: { ["a", "b"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    let keys = try runtime.eval("Object.keys(globalThis.hostObj)").getArray()

    #expect(keys.length == 2)
    #expect(keys[0].getString() == "a")
    #expect(keys[1].getString() == "b")
  }

  @Test
  func `host object accessible from JavaScript`() throws {
    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "greeting" {
          return JavaScriptValue(self.runtime, "hello")
        }
        return .undefined()
      },
      getPropertyNames: { ["greeting"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    let result = try runtime.eval("globalThis.hostObj.greeting")

    #expect(result.getString() == "hello")
  }

  @Test
  func `host object receives non-ASCII property names`() throws {
    var receivedNames: [String] = []
    var setNames: [String] = []

    let hostObject = runtime.createHostObject(
      get: { name in
        receivedNames.append(name)
        return .undefined()
      },
      set: { name, _ in
        setNames.append(name)
      }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    _ = try runtime.eval("globalThis.hostObj['właściwość']; globalThis.hostObj['🚀'] = 1")

    #expect(receivedNames == ["właściwość"])
    #expect(setNames == ["🚀"])
  }

  @Test
  func `host object receives long property names`() throws {
    var receivedName: String?
    let longName = String(repeating: "a", count: 300)

    let hostObject = runtime.createHostObject(
      get: { name in
        receivedName = name
        return .undefined()
      }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    _ = try runtime.eval("globalThis.hostObj['\(longName)']")

    #expect(receivedName == longName)
  }

  @Test
  func `isHostObject distinguishes host objects from plain ones`() {
    let hostObject = runtime.createHostObject(
      get: { _ in .undefined() }
    )
    let plainObject = runtime.createObject()

    #expect(hostObject.isHostObject() == true)
    #expect(plainObject.isHostObject() == false)
  }

  @Test
  func `host object default getPropertyNames returns no keys in JavaScript`() throws {
    let hostObject = runtime.createHostObject(
      get: { _ in .undefined() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let count = try runtime.eval("Object.keys(globalThis.hostObj).length")
    #expect(count.getInt() == 0)
  }

  // MARK: - Host object error propagation

  @Test
  func `throwing host object setter propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "set failed" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined() },
      set: { _, _ in throw TestError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; 'no error' } catch (e) { e.message }
      """
    )

    #expect(result.getString().contains("set failed"))
  }

  @Test
  func `throwing host object setter with JavaScriptThrowable preserves code`() throws {
    struct TypedError: JavaScriptThrowable {
      var message: String { "read only" }
      var code: String { "ERR_READ_ONLY" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined() },
      set: { _, _ in throw TypedError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "read only")
    #expect(result[1].getString() == "ERR_READ_ONLY")
  }

  @Test
  func `throwing host object getter propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "get failed" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in throw TestError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo; 'no error' } catch (e) { e.message }
      """
    )

    #expect(result.getString().contains("get failed"))
  }

  @Test
  func `throwing host object getter with JavaScriptThrowable preserves code`() throws {
    struct TypedError: JavaScriptThrowable {
      var message: String { "missing" }
      var code: String { "ERR_MISSING" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in throw TypedError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "missing")
    #expect(result[1].getString() == "ERR_MISSING")
  }

  @Test
  func `host object setter recovers after throwing`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "boom" }
    }
    var stored: Int = 0
    var shouldThrow = true

    let hostObject = runtime.createHostObject(
      get: { _ in JavaScriptValue(self.runtime, stored) },
      set: { _, value in
        if shouldThrow {
          throw TestError()
        }
        stored = value.getInt()
      },
      getPropertyNames: { ["value"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    // First write throws and is caught in JS.
    let firstAttempt = try runtime.eval(
      """
        try { globalThis.hostObj.value = 1; 'no error' } catch (e) { e.message }
      """
    )
    #expect(firstAttempt.getString().contains("boom"))

    // Subsequent write must succeed — verifies the C++ thread-local error
    // state is cleared after being rethrown, not leaked to the next call.
    shouldThrow = false
    let secondAttempt = try runtime.eval(
      """
        try { globalThis.hostObj.value = 7; globalThis.hostObj.value } catch (e) { -1 }
      """
    )
    #expect(secondAttempt.getInt() == 7)
  }

  @Test
  func `host object setter error does not pollute later getter`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "set failed" }
    }

    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "ok" {
          return JavaScriptValue(self.runtime, 123)
        }
        return .undefined()
      },
      set: { _, _ in throw TestError() },
      getPropertyNames: { ["ok"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    // A failing set followed by a successful get must not surface the
    // earlier set error — checks the thread-local error slot is cleared.
    let result = try runtime.eval(
      """
        try { globalThis.hostObj.value = 1 } catch (e) {}
        globalThis.hostObj.ok
      """
    )

    #expect(result.getInt() == 123)
  }

  @Test
  func `read-only host object rejects assignment from JavaScript`() throws {
    let hostObject = runtime.createHostObject(
      get: { _ in JavaScriptValue(self.runtime, 1) }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    // No `set` was provided — the C++ side raises a `jsi::JSError` directly,
    // without crossing the Swift boundary.
    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; 'no error' } catch (e) { e.message }
      """
    )
    let message = result.getString()

    #expect(message.contains("read-only host object"))
    #expect(message.contains("'foo'"))
  }

  @Test
  func `non-throwing host object setter does not trigger error`() throws {
    var stored: Int = 0
    let hostObject = runtime.createHostObject(
      get: { _ in JavaScriptValue(self.runtime, stored) },
      set: { _, value in stored = value.getInt() },
      getPropertyNames: { ["value"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.value = 7; globalThis.hostObj.value } catch (e) { -1 }
      """
    )

    #expect(result.getInt() == 7)
  }

  @Test
  func `host getter that calls failing JS preserves the original error`() throws {
    try runtime.eval(
      """
        globalThis.throwTagged = function () {
          const e = new Error('inner failure');
          e.code = 'ERR_INNER';
          throw e;
        };
      """
    )
    let throwTagged = try runtime.global().getPropertyAsFunction("throwTagged")

    let hostObject = runtime.createHostObject(
      get: { _ in
        // Calling JS that throws surfaces an `expo.CppError` wrapping the original
        // `jsi::JSError`. Letting it propagate exercises the CppError relay path.
        _ = try throwTagged.call()
        return .undefined()
      }
    )
    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "inner failure")
    #expect(result[1].getString() == "ERR_INNER")
  }

  @Test
  func `host setter that calls failing JS preserves the original error`() throws {
    try runtime.eval(
      """
        globalThis.throwTagged = function () {
          const e = new Error('inner setter failure');
          e.code = 'ERR_SETTER';
          throw e;
        };
      """
    )
    let throwTagged = try runtime.global().getPropertyAsFunction("throwTagged")

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined() },
      set: { _, _ in
        _ = try throwTagged.call()
      }
    )
    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "inner setter failure")
    #expect(result[1].getString() == "ERR_SETTER")
  }

  // MARK: - Host function error propagation

  @Test
  func `throwing host function propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "something went wrong" }
    }

    let fn = runtime.createFunction("failing") { this, arguments in
      throw TestError()
    }

    runtime.global().setProperty("failing", value: fn.asValue())

    let result = try runtime.eval(
      """
        try { failing(); 'no error' } catch (e) { e.message }
      """
    )

    #expect(result.getString().contains("something went wrong"))
  }

  @Test
  func `throwing host function is catchable in JavaScript try-catch`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "custom error message" }
    }

    let fn = runtime.createFunction("throwIt") { this, arguments in
      throw TestError()
    }

    runtime.global().setProperty("throwIt", value: fn.asValue())

    let result = try runtime.eval(
      """
        var caught = false;
        var message = '';
        try { throwIt(); } catch (e) { caught = true; message = e.message; }
        [caught, message]
      """
    ).getArray()

    #expect(result[0].getBool() == true)
    #expect(result[1].getString().contains("custom error message"))
  }

  @Test
  func `non-throwing host function does not trigger error`() throws {
    let fn = runtime.createFunction("ok") { this, arguments in
      return JavaScriptValue(self.runtime, 42)
    }

    runtime.global().setProperty("ok", value: fn.asValue())

    let result = try runtime.eval("try { ok() } catch (e) { -1 }")

    #expect(result.getInt() == 42)
  }

  @Test
  func `host function results of primitive kinds reach JavaScript unchanged`() throws {
    runtime.global().setProperty("yes", value: runtime.createFunction("yes") { _, _ in .true() }.asValue())
    runtime.global().setProperty("no", value: runtime.createFunction("no") { _, _ in .false() }.asValue())
    runtime.global().setProperty("nothing", value: runtime.createFunction("nothing") { _, _ in .null() }.asValue())
    runtime.global().setProperty("half", value: runtime.createFunction("half") { _, _ in .number(0.5) }.asValue())
    let result = try runtime.eval("[yes() === true, no() === false, nothing() === null, half() === 0.5]").getArray()
    #expect(result[0].getBool() == true)
    #expect(result[1].getBool() == true)
    #expect(result[2].getBool() == true)
    #expect(result[3].getBool() == true)
  }

  // MARK: - Void host functions

  @Test
  func `void host function runs its closure and returns undefined`() throws {
    let fn = runtime.createFunction("record") {
      [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
      try this.asObject(in: runtime).setProperty("seen", value: arguments[0])
    }
    runtime.global().setProperty("record", value: fn.asValue())

    let result = try runtime.eval("var target = {}; [record.call(target, 3), target.seen]").getArray()

    #expect(result[0].isUndefined() == true)
    #expect(result[1].getInt() == 3)
  }

  @Test
  func `throwing void host function propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "void failure" }
    }

    let fn = runtime.createFunction("failing") {
      (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) throws -> Void in
      throw TestError()
    }
    runtime.global().setProperty("failing", value: fn.asValue())

    let result = try runtime.eval("try { failing(); 'no error' } catch (e) { e.message }")

    #expect(result.getString().contains("void failure"))
  }

  @Test
  func `setProperty with a void closure installs a function returning undefined`() throws {
    let object = runtime.createObject()
    object.setProperty("bump") {
      [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) -> Void in
      let target = try this.asObject(in: runtime)
      target.setProperty("calls", value: JavaScriptValue(runtime, target.getProperty("calls").getInt() + 1))
    }
    object.setProperty("calls", value: JavaScriptValue(runtime, 0))
    runtime.global().setProperty("counter", value: object.asValue())

    let result = try runtime.eval("[counter.bump(), counter.bump(), counter.calls]").getArray()

    #expect(result[0].isUndefined() == true)
    #expect(result[1].isUndefined() == true)
    #expect(result[2].getInt() == 2)
  }

  // MARK: - Host functions with a result slot

  @Test
  func `host function writes its result into the slot`() throws {
    let fn = runtime.createFunction("add") {
      (
        this: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      let a = try Int.decode(arguments.unownedValue(at: 0), in: runtime)
      let b = try Int.decode(arguments.unownedValue(at: 1), in: runtime)
      try Int.encode(a + b, into: result, in: runtime)
    }
    runtime.global().setProperty("add", value: fn.asValue())

    #expect(try runtime.eval("add(3, 38)").getInt() == 41)
  }

  @Test
  func `host function result slot holds strings, objects and the default path`() throws {
    let object = runtime.createObject()
    object.setProperty("greet") {
      (
        this: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      let name = try String.decode(arguments.unownedValue(at: 0), in: runtime)
      try String.encode("hello \(name)", into: result, in: runtime)
    }
    object.setProperty("pair") {
      (
        this: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      try [String: Int].encode(["a": 1], into: result, in: runtime)
    }
    runtime.global().setProperty("host", value: object.asValue())

    let result = try runtime.eval("[host.greet('café'), host.pair().a]").getArray()

    #expect(result[0].getString() == "hello café")
    #expect(result[1].getInt() == 1)
  }

  @Test
  func `host function that writes nothing returns undefined`() throws {
    let fn = runtime.createFunction("nothing") {
      (
        this: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
    }
    runtime.global().setProperty("nothing", value: fn.asValue())

    #expect(try runtime.eval("nothing()").isUndefined() == true)
  }

  @Test
  func `throwing host function with a result slot propagates error to JavaScript`() throws {
    let fn = runtime.createFunction("unsafe") {
      (
        this: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      try Int.encode(Int.max, into: result, in: runtime)
    }
    runtime.global().setProperty("unsafe", value: fn.asValue())

    let result = try runtime.eval("try { unsafe(); 'no error' } catch (e) { e.message }")

    #expect(result.getString().contains("Int64 or UInt64"))
  }

  // MARK: - Async functions

  @Test
  func `async function returns promise`() throws {
    let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
      return {
        return JavaScriptValue(self.runtime, 42)
      }
    }
    let result = try fn.call()

    #expect(result.isObject() == true)
    #expect(result.is("Promise") == true)
  }

  @Test
  func `async function propagates promise construction failure`() throws {
    let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
      return {
        return JavaScriptValue(self.runtime, 42)
      }
    }
    runtime.global().setProperty("asyncFn", value: fn.asValue())
    try runtime.eval("globalThis.Promise = undefined")

    #expect(throws: Error.self) {
      _ = try runtime.eval("globalThis.asyncFn()")
    }
  }

  @Test
  func `async function resolves with value`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
        return {
          return JavaScriptValue(runtime, 42)
        }
      }

      let result = try await fn.call().getPromise().await()
      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `async function receives arguments`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let fn = runtime.createAsyncFunction("add") { this, arguments in
        // Decode phase: the buffer is only borrowed here and cannot escape into the body.
        let a = arguments[0].getInt()
        let b = arguments[1].getInt()
        return {
          return JavaScriptValue(runtime, a + b)
        }
      }

      let result = try await fn.call(arguments: 20, 22).getPromise().await()
      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `async function rejects on error thrown from the body`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      struct TestError: Error {
        var localizedDescription: String { "something went wrong" }
      }

      let fn = runtime.createAsyncFunction("failing") { this, arguments in
        return {
          throw TestError()
        }
      }

      await #expect(throws: Error.self) {
        _ = try await fn.call().getPromise().await()
      }
    }
  }

  @Test
  func `async function rejects on error thrown from the decode phase`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      struct TestError: Error {
        var localizedDescription: String { "something went wrong" }
      }

      let fn = runtime.createAsyncFunction("failing") { this, arguments in
        throw TestError()
      }

      // The closure throws before any suspension, but the call itself must not throw —
      // matching JavaScript's async-function semantics, the returned promise rejects instead.
      let promise = try fn.call().getPromise()
      await #expect(throws: Error.self) {
        _ = try await promise.await()
      }
    }
  }

  @Test
  func `async function callable from JavaScript`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let fn = runtime.createAsyncFunction("greet") { this, arguments in
        let name = arguments[0].getString()
        return {
          return JavaScriptValue(runtime, "Hello, \(name)!")
        }
      }

      runtime.global().setProperty("greet", value: fn.asValue())
      let result = try await runtime.evalAsync("Promise.resolve(greet('World'))").ref()

      #expect(try await runtime.execute { try result.take().getString() } == "Hello, World!")
    }
  }

  @Test
  func `async function call dropped by a dying scheduler does not touch a freed runtime`() throws {
    // Regression test for the reload crash (#47716): the React runtime scheduler tears down with
    // async host function tasks still queued, and the dropped task closures used to own a copy of
    // the arguments buffer (and `this`). Their `jsi::Value` destructors then ran wherever the
    // dropped closures were released, against the already destroyed Hermes runtime — the
    // `JavaScriptValuesBuffer.deinit` use-after-free. With the two-phase `AsyncFunctionClosure`,
    // the decode happens within the host call and the scheduled task captures no JSI-owned values,
    // so dropping it after teardown is harmless.
    heldSchedulerTasks.removeAll()
    do {
      let baseRuntime = JavaScriptRuntime()
      let schedulerRuntime = baseRuntime.withUnsafePointee { pointer in
        JavaScriptRuntime(
          unsafePointer: pointer,
          // Opaque scheduler handle, never dereferenced by `holdSchedulerTask`.
          scheduler: UnsafeMutableRawPointer(bitPattern: 0x1)!,
          dispatch: unsafeBitCast(holdSchedulerTask, to: UnsafeRawPointer.self)
        )
      }
      // The body deliberately captures nothing: a captured runtime wrapper would outlive the
      // runtime inside the dropped task and tear down its cached `jsi::PropNameID`s against freed
      // memory — a separate, pre-existing hazard of wrappers outliving their runtime.
      let fn = schedulerRuntime.createAsyncFunction("asyncFn") { this, arguments in
        return {
          return .undefined()
        }
      }
      // Call with a JS object argument — the kind whose destruction after teardown crashes.
      _ = try fn.call(arguments: schedulerRuntime.createObject().asValue().ref())
      // The decode phase ran synchronously within the call; the async body is queued on the
      // scheduler, emulating a task that React never gets to run before the reload.
      #expect(heldSchedulerTasks.count == 1)
      // Leaving the scope destroys the Hermes runtime (emulating the reload) while the scheduler
      // still holds the task. The teardown sweep releases the promise's JSI state on this thread.
    }
    // The dying scheduler drops the task without ever running it. Releasing the last reference to
    // its closure must not touch the freed runtime — this is the crash point of #47716. Drained
    // through a local copy defensively: releasing a task can schedule follow-up work (e.g. the
    // promise wrapper's deinit schedules its cleanup while its runtime is still alive), which
    // would append to `heldSchedulerTasks` while `removeAll()` is mutating it.
    do {
      let droppedTasks = heldSchedulerTasks
      heldSchedulerTasks.removeAll()
      _ = consume droppedTasks
    }
  }

  // MARK: - Class creation

  @Test
  func `create class and construct instance`() throws {
    let klass = try runtime.createClass(name: "Point") { this, arguments in
      let obj = this.getObject()
      obj.setProperty("x", value: arguments[0])
      obj.setProperty("y", value: arguments[1])
      return this
    }

    let instance = try klass.callAsConstructor(10, 20)
    #expect(instance.getObject().getProperty("x").getInt() == 10)
    #expect(instance.getObject().getProperty("y").getInt() == 20)
  }

  @Test
  func `create class with inheritance`() throws {
    let baseClass = try runtime.createClass(name: "Base") { this, arguments in
      this.getObject().setProperty("base", value: true)
      return this
    }

    let childClass = try runtime.createClass(name: "Child", inheriting: baseClass) { this, arguments in
      this.getObject().setProperty("child", value: true)
      return this
    }

    let instance = try childClass.callAsConstructor()
    #expect(instance.getObject().getProperty("child").getBool() == true)
  }

  @Test
  func `create class is callable from JavaScript`() throws {
    let klass = try runtime.createClass(name: "Greeter") { this, arguments in
      this.getObject().setProperty("name", value: arguments[0])
      return this
    }

    runtime.global().setProperty("Greeter", value: klass.asValue())
    let result = try runtime.eval("new Greeter('World').name")

    #expect(result.getString() == "World")
  }

  @Test
  func `created class has correct name`() throws {
    let klass = try runtime.createClass(name: "MyClass") { this, arguments in
      return this
    }

    #expect(klass.asObject().getProperty("name").getString() == "MyClass")
  }

  @Test
  func `classes from the shared factory are independent`() throws {
    let first = try runtime.createClass(name: "First") { this, _ in
      this.getObject().setProperty("kind", value: "first")
      return this
    }
    let second = try runtime.createClass(name: "Second") { this, _ in
      this.getObject().setProperty("kind", value: "second")
      return this
    }
    runtime.global().setProperty("First", value: first.asValue())
    runtime.global().setProperty("Second", value: second.asValue())

    let result = try runtime.eval(
      """
      First !== Second && First.prototype !== Second.prototype
        && First.name === 'First' && Second.name === 'Second'
        && new First().kind === 'first' && new Second().kind === 'second'
        && !(new First() instanceof Second)
      """
    )
    #expect(result.getBool() == true)
  }

  @Test
  func `create class throws on invalid name with special characters`() {
    #expect(throws: JavaScriptRuntime.InvalidIdentifierError.self) {
      _ = try runtime.createClass(name: "bad); evil(") { this, _ in this }
    }
  }

  @Test
  func `create class throws on empty name`() {
    #expect(throws: JavaScriptRuntime.InvalidIdentifierError.self) {
      _ = try runtime.createClass(name: "") { this, _ in this }
    }
  }

  @Test
  func `create class throws on name starting with digit`() {
    #expect(throws: JavaScriptRuntime.InvalidIdentifierError.self) {
      _ = try runtime.createClass(name: "1Foo") { this, _ in this }
    }
  }

  @Test
  func `create class accepts valid identifier with dollar and underscore`() throws {
    let klass = try runtime.createClass(name: "$_Foo123") { this, _ in this }
    #expect(klass.asObject().getProperty("name").getString() == "$_Foo123")
  }

  // MARK: - Unsafe pointee access

  @Test
  func `withUnsafePointee returns non-null pointee`() {
    runtime.withUnsafePointee { runtimePointee in
      #expect(runtimePointee != UnsafeMutableRawPointer(bitPattern: 0))
    }
  }

  @Test
  func `withUnsafePointee returns value from closure`() {
    let result = runtime.withUnsafePointee { _ in
      return 42
    }
    #expect(result == 42)
  }

  @Test
  func `withUnsafePointee returns same pointee across calls`() {
    let pointee1 = runtime.withUnsafePointee { return $0 }
    let pointee2 = runtime.withUnsafePointee { return $0 }
    #expect(pointee1 == pointee2)
  }

  @Test
  func `withUnsafePointees passes the same pointees as withUnsafePointee`() {
    let object = runtime.createObject()
    let value = JavaScriptValue(runtime, 42)
    let runtimePointee = runtime.withUnsafePointee { return $0 }
    let objectPointee = object.withUnsafePointee { return $0 }
    let valuePointee = value.withUnsafePointee { return $0 }
    var callCount = 0

    runtime.withUnsafePointees(object: object, value: value) { runtimePointer, objectPointer, valuePointer in
      callCount += 1
      #expect(runtimePointer == runtimePointee)
      #expect(objectPointer == objectPointee)
      #expect(valuePointer == valuePointee)
    }
    #expect(callCount == 1)
  }

  @Test
  func `init from unsafePointer creates functional runtime`() throws {
    let newRuntime = runtime.withUnsafePointee { runtimePointee in
      return JavaScriptRuntime(unsafePointer: runtimePointee)
    }
    let result = try newRuntime.eval("1 + 2")
    #expect(result.getInt() == 3)
  }

  @Test
  func `id is equal across wrappers of the same underlying runtime`() {
    // A second wrapper around the same underlying `jsi::Runtime` shares the runtime's identity, even
    // though it is a distinct `JavaScriptRuntime` instance (so `===` differs). This is the guarantee
    // `id` provides over wrapper identity.
    let otherWrapper = runtime.withUnsafePointee { JavaScriptRuntime(unsafePointer: $0) }
    #expect(otherWrapper.id == runtime.id)
    #expect(otherWrapper !== runtime)
  }

  @Test
  func `id differs between distinct runtimes`() {
    let otherRuntime = JavaScriptRuntime()
    #expect(otherRuntime.id != runtime.id)
  }

  @Test
  func `creating and releasing standalone runtimes repeatedly does not crash`() throws {
    // Each standalone runtime owns its Hermes runtime and destroys it on `deinit`. Cycling through
    // many create/use/release rounds exercises that teardown and would surface a use-after-free or
    // double-free (destroying a runtime must not corrupt a subsequently created one). Calling `is`
    // caches a `PropNameID` on the runtime, so this also covers releasing cached JSI objects before
    // the runtime is freed.
    for index in 0..<20 {
      let localRuntime = JavaScriptRuntime()
      let value = try localRuntime.eval("({ index: \(index) })")
      #expect(value.is("Object") == true)
      #expect(value.getObject().getProperty("index").getInt() == index)
    }
  }

  // MARK: - Long-lived objects teardown

  /// Records whether `allowRelease()` was called.
  final class TrackedObject: LongLivedObject {
    private(set) var released = false

    func allowRelease() {
      released = true
    }
  }

  @Test
  func `tearing down the runtime clears its long-lived objects`() {
    let tracked = TrackedObject()

    do {
      let localRuntime = JavaScriptRuntime()
      localRuntime.longLivedObjects.add(tracked)
      #expect(localRuntime.longLivedObjects.count == 1)
      // Leaving the scope releases the runtime. Its `deinit` destroys the owned Hermes runtime,
      // tearing down the JS heap, which drops the teardown object's native state and fires its
      // deallocator, sweeping the collection.
    }

    #expect(tracked.released == true)
  }

  @Test
  func `an object removed before teardown is not released by the sweep`() {
    let tracked = TrackedObject()

    do {
      let localRuntime = JavaScriptRuntime()
      localRuntime.longLivedObjects.add(tracked)
      localRuntime.longLivedObjects.remove(tracked)
    }

    #expect(tracked.released == false)
  }

  @Test
  func `wrapping the same runtime again does not sweep the first wrapper's objects`() {
    // Each wrapper pins its own teardown object under a per-wrapper property name. A second wrapper
    // of the same underlying runtime must not overwrite the first's pinned object (which would let
    // it be collected early and sweep the first wrapper's collection while the runtime is alive).
    let tracked = TrackedObject()
    runtime.longLivedObjects.add(tracked)
    _ = runtime.withUnsafePointee { JavaScriptRuntime(unsafePointer: $0) }
    #expect(tracked.released == false)
    #expect(runtime.longLivedObjects.count == 1)
  }

  @Test
  func `non-owning wrapper outliving its runtime does not destroy cached PropNameIDs against freed memory`() throws {
    // A non-owning wrapper's `deinit` returns early, so its stored `propNameIdsRegistry` is
    // destroyed whenever the wrapper deallocates. If the wrapper outlives its runtime (e.g. it is
    // captured by a task abandoned on reload), the cached `jsi::PropNameID` destructors used to run
    // against the freed Hermes runtime, a use-after-free. Now the teardown sweep flushes the
    // registry on the JS thread while the runtime is still valid.
    var wrapper: JavaScriptRuntime? = nil
    do {
      let baseRuntime = JavaScriptRuntime()
      wrapper = baseRuntime.withUnsafePointee { JavaScriptRuntime(unsafePointer: $0) }
      // Creating a promise populates the wrapper's registry with cached "Promise" and "then" IDs.
      _ = try JavaScriptPromise(wrapper!)
      // Leaving the scope destroys the Hermes runtime while the wrapper is still alive; its
      // teardown sweep must flush the cached PropNameIDs before Hermes is destroyed.
    }
    // Deallocating the wrapper here must not touch the freed runtime. Reaching the end of the test
    // without a crash is the assertion.
    wrapper = nil
    _ = wrapper
  }

  // MARK: - Microtasks

  @Test
  func `promise reactions run after the synchronous code`() throws {
    try runtime.eval(
      """
      globalThis.log = [];
      Promise.resolve().then(() => log.push('then'));
      log.push('sync');
      """
    )
    // Like in React Native, reactions wait for the host to drain the queue after the task.
    #expect(try runtime.eval("log.join(',')").getString() == "sync")

    try runtime.drainMicrotasks()
    #expect(try runtime.eval("log.join(',')").getString() == "sync,then")
  }

  @Test
  func `drainMicrotasks throws the first error after running the rest of the queue`() throws {
    try runtime.eval("globalThis.log = []")
    runtime.queueMicrotask(try runtime.eval("() => { throw new Error('first') }").getFunction())
    runtime.queueMicrotask(try runtime.eval("() => { throw new Error('second') }").getFunction())
    runtime.queueMicrotask(try runtime.eval("() => { log.push('after') }").getFunction())

    let error = #expect(throws: JavaScriptError.self) {
      try runtime.drainMicrotasks()
    }
    #expect(error?.toValue().getObject().getProperty("message").getString() == "first")
    #expect(try runtime.eval("log.join(',')").getString() == "after")
  }

  @Test
  func `drainMicrotasks called from a microtask leaves the rest of the queue for later`() throws {
    let drain = runtime.createFunction("drain") { [runtime] _, _ in
      try runtime.drainMicrotasks()
      return .undefined()
    }
    runtime.global().setProperty("drain", value: drain)
    try runtime.eval(
      """
      globalThis.log = [];
      Promise.resolve().then(() => {
        log.push('first start');
        drain();
        log.push('first end');
      });
      Promise.resolve().then(() => log.push('second'));
      """
    )
    try runtime.drainMicrotasks()
    // Like React Native's checkpoint, the nested call returns at once, so the first microtask runs
    // to completion before the second one starts.
    #expect(try runtime.eval("log.join(',')").getString() == "first start,first end,second")
  }

  @Test
  func `awaits in a loop do not grow the native stack`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      // Each `await` continuation runs from the microtask queue, not nested in the code that
      // resolved its promise, so the loop needs no more native stack than a single iteration.
      let result = try await runtime.evalAsync(
        """
        (async () => {
          for (let i = 0; i < 10000; i++) {
            await null;
          }
          return 'done';
        })()
        """
      ).ref()
      #expect(try await runtime.execute { try result.take().getString() } == "done")
    }
  }

  // MARK: - Garbage collection

  @Test
  func `collecting garbage releases an unreachable object`() {
    var weakObject: JavaScriptWeakObject? = nil

    do {
      let object = runtime.createObject()
      weakObject = JavaScriptWeakObject(runtime, object)
      #expect((weakObject?.lock() != nil) == true)
    }

    runtime.collectGarbage { weakObject?.lock() == nil }

    #expect((weakObject?.lock() == nil) == true)
  }

  @Test
  func `collecting garbage keeps a reachable object alive`() {
    let object = runtime.createObject()
    object.setProperty("survives", value: true)
    let weakObject = JavaScriptWeakObject(runtime, object)

    runtime.collectGarbage(cause: "test")

    let survives = weakObject.lock()?.getProperty("survives").getBool()
    #expect(survives == true)
  }
}

/// Returns the CPU time the calling thread spent in `body`, in seconds.
private func measureThreadCPUTime(_ body: () throws -> Void) rethrows -> Double {
  func threadCPUTime() -> Double {
    var time = timespec()
    clock_gettime(CLOCK_THREAD_CPUTIME_ID, &time)
    return Double(time.tv_sec) + Double(time.tv_nsec) / 1e9
  }
  let start = threadCPUTime()
  try body()
  return threadCPUTime() - start
}

/// Records whether a `runOrSchedule` block ran. A class instead of a `nonisolated(unsafe) var` captured
/// by the block, which Swift 6.2 rejects as a data race. Safe without synchronization: the test only
/// reads it after the block ran inline on the same thread.
private final class InlineRunFlag: @unchecked Sendable {
  var value = false
}

/// Tasks captured by `holdSchedulerTask` instead of being executed, emulating a React
/// `RuntimeScheduler` that is torn down with work still queued (the #47716 reload scenario).
/// Safe without synchronization: the dispatch always runs synchronously on the test's thread.
nonisolated(unsafe) private var heldSchedulerTasks: [() -> Void] = []

/// A `dispatch` trampoline for `JavaScriptRuntime.init(unsafePointer:scheduler:dispatch:)` that
/// holds the scheduled tasks instead of running them, so a test controls when (and whether) they
/// are released. Matches `expo.RuntimeScheduler.ScheduleFn`.
private let holdSchedulerTask:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { _, _, callback in
    heldSchedulerTasks.append(callback)
  }

/// Runs `body` on a freshly spawned synchronous thread and bridges the result back into the
/// async test. The thread has a real run loop, which the cross-thread `execute` path pumps.
private func onSyncOffThread<R: Sendable>(
  _ body: @escaping @Sendable () throws -> R
) async throws -> R {
  return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<R, any Error>) in
    Thread.detachNewThread {
      do {
        continuation.resume(returning: try body())
      } catch {
        continuation.resume(throwing: error)
      }
    }
  }
}

/// Whether `body` throws ``JavaScriptCallback/RuntimeLostError``.
private func isRuntimeLostError(_ body: () throws -> Int) -> Bool {
  do {
    _ = try body()
    return false
  } catch {
    return error is JavaScriptCallback.RuntimeLostError
  }
}
