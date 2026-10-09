// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Records whether the wrapped function ran on the JavaScript thread.
private final class ThreadFlag: @unchecked Sendable {
  var value: Bool?
}

private struct NativeError: Error, CustomStringConvertible {
  var description: String {
    return "native failure"
  }
}

@Suite
@JavaScriptActor
struct JavaScriptCallbackTests {
  let runtime = JavaScriptRuntime()

  /// Evaluates `source` and decodes the result the way generated bindings decode a closure argument.
  private func callback(_ source: String) throws -> JavaScriptCallback {
    let value = try runtime.eval(source)
    return try value.withUnownedValue(in: runtime) { unownedValue in
      try JavaScriptCallback.decode(unownedValue, in: runtime)
    }
  }

  /// A stand-in for React Native's `ErrorUtils` that stores the reported message.
  private func installErrorUtils() throws {
    try runtime.eval("globalThis.ErrorUtils = { reportError(error) { globalThis.reported = error.message } }")
  }

  // MARK: - Decoding

  @Test
  func `throws when the value isn't a function`() {
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try callback("42")
    }
  }

  @Test
  func `decodeIfPresent returns nil for undefined and null`() throws {
    for source in ["undefined", "null"] {
      let value = try runtime.eval(source)
      let callback = try value.withUnownedValue(in: runtime) { unownedValue in
        try JavaScriptCallback.decodeIfPresent(unownedValue, in: runtime)
      }
      #expect(callback == nil)
    }
  }

  @Test
  func `decodeIfPresent wraps a function`() throws {
    let value = try runtime.eval("() => {}")
    let callback = try value.withUnownedValue(in: runtime) { unownedValue in
      try JavaScriptCallback.decodeIfPresent(unownedValue, in: runtime)
    }
    #expect(callback != nil)
  }

  // MARK: - invokeBlocking

  @Test
  func `invokeBlocking encodes the arguments and decodes the result`() throws {
    let callback = try callback("(a, b) => a + b")
    #expect(try callback.invokeBlocking(2, 3, returning: Int.self) == 5)
  }

  @Test
  func `invokeBlocking without a result calls the function`() throws {
    let callback = try callback("(value) => { globalThis.received = value }")
    try callback.invokeBlocking("hello")
    #expect(try runtime.eval("globalThis.received").asString() == "hello")
  }

  @Test
  func `invokeBlocking rethrows a JavaScript exception`() throws {
    let callback = try callback("() => { throw new Error('boom') }")
    #expect(throws: (any Error).self) {
      try callback.invokeBlocking()
    }
  }

  // MARK: - invokeDetached

  @Test
  func `invokeDetached calls the function`() throws {
    let callback = try callback("(value) => { globalThis.received = value }")
    callback.invokeDetached(7)
    #expect(try runtime.eval("globalThis.received").asInt() == 7)
  }

  @Test
  func `invokeDetached reports a JavaScript exception through ErrorUtils`() throws {
    try installErrorUtils()
    let callback = try callback("() => { throw new Error('boom') }")
    callback.invokeDetached()
    #expect(try runtime.eval("globalThis.reported").asString() == "boom")
  }

  // MARK: - reportError

  @Test
  func `reportError sends a native error to ErrorUtils`() throws {
    try installErrorUtils()
    let callback = try callback("() => {}")
    callback.reportError(NativeError())
    #expect(try runtime.eval("globalThis.reported").asString() == "native failure")
  }

  @Test
  func `reportError falls back to console.error without ErrorUtils`() throws {
    try runtime.eval("globalThis.console = { error(error) { globalThis.logged = error.message } }")
    let callback = try callback("() => {}")
    callback.reportError(NativeError())
    #expect(try runtime.eval("globalThis.logged").asString() == "native failure")
  }

  @Test
  func `reportError prefers ErrorUtils over console.error`() throws {
    try installErrorUtils()
    try runtime.eval("globalThis.console = { error(error) { globalThis.logged = error.message } }")
    let callback = try callback("() => {}")
    callback.reportError(NativeError())
    #expect(try runtime.eval("globalThis.reported").asString() == "native failure")
    #expect(try runtime.eval("typeof globalThis.logged").getString() == "undefined")
  }

  @Test
  func `reportError without ErrorUtils doesn't throw into JavaScript`() throws {
    let callback = try callback("() => {}")
    callback.reportError(NativeError())
    #expect(try runtime.eval("typeof globalThis.reported").getString() == "undefined")
  }

  // MARK: - invokeAsync

  @Test
  func `invokeAsync awaits a returned promise and decodes the resolved value`() async throws {
    let callback = try callback("async (value) => value * 2")
    #expect(try await callback.invokeAsync(4, returning: Int.self) == 8)
  }

  @Test
  func `invokeAsync decodes a value returned without a promise`() async throws {
    let callback = try callback("(value) => value + '!'")
    #expect(try await callback.invokeAsync("hi", returning: String.self) == "hi!")
  }

  @Test
  func `invokeAsync rethrows a promise rejection`() async throws {
    let callback = try callback("async () => { throw new Error('rejected') }")
    await #expect(throws: (any Error).self) {
      try await callback.invokeAsync()
    }
  }

  // MARK: - Lifetime

  @Test
  func `keeps the function registered until the callback is released`() throws {
    let countBefore = runtime.longLivedObjects.count
    do {
      let callback = try callback("() => {}")
      #expect(runtime.longLivedObjects.count == countBefore + 1)
      withExtendedLifetime(callback) {}
    }
    #expect(runtime.longLivedObjects.count == countBefore)
  }

  @Test
  func `throws RuntimeLostError after the runtime released the function`() throws {
    let callback = try callback("() => 1")
    // The teardown sweep, which the runtime runs before it's destroyed.
    runtime.longLivedObjects.clear()
    #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      try callback.invokeBlocking()
    }
  }
}

/// Calls from other threads. A standalone runtime runs scheduled work inline, so these tests give the
/// runtime its own JavaScript thread with `TestRuntimeScheduler`.
@Suite
struct JavaScriptCallbackThreadingTests {
  /// Lets the scheduler's thread release the callback and run its release task before the test
  /// drops the scheduler, which the runtime refers to by an unretained pointer.
  private func drain(_ testRuntime: TestRuntime) async {
    await testRuntime.scheduler.run {}
    await testRuntime.scheduler.run {}
  }

  /// Wraps a function that records whether it ran on the JavaScript thread.
  private func makeRecordingCallback(_ testRuntime: TestRuntime, flag: ThreadFlag) async throws -> JavaScriptCallback {
    return try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      let function = runtime.createFunction("record") { _, _ in
        flag.value = runtime.isOnJavaScriptThread()
        return JavaScriptValue(runtime, 42)
      }
      return try function.asValue().withUnownedValue(in: runtime) { unownedValue in
        try JavaScriptCallback.decode(unownedValue, in: runtime)
      }
    }
  }

  @Test
  func `invokeBlocking from another thread runs the function on the JavaScript thread`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let flag = ThreadFlag()
    do {
      let callback = try await makeRecordingCallback(testRuntime, flag: flag)

      // A blocking call from a plain dispatch thread, the way native code calls a stored closure.
      let result: Int = try await withCheckedThrowingContinuation { continuation in
        DispatchQueue.global().async {
          continuation.resume(with: Result { try callback.invokeBlocking(returning: Int.self) })
        }
      }
      #expect(result == 42)
      #expect(flag.value == true)
    }
    await drain(testRuntime)
  }

  @Test
  func `invokeAsync from another thread runs the function on the JavaScript thread`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let flag = ThreadFlag()
    do {
      let callback = try await makeRecordingCallback(testRuntime, flag: flag)
      #expect(try await callback.invokeAsync(returning: Int.self) == 42)
      #expect(flag.value == true)
    }
    await drain(testRuntime)
  }

  @Test
  func `invokeAsync decodes a resolved promise on the JavaScript thread`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    do {
      let callback = try await testRuntime.scheduler.runIsolated {
        let runtime = testRuntime.runtime
        return try runtime.eval("async () => 5").withUnownedValue(in: runtime) { unownedValue in
          try JavaScriptCallback.decode(unownedValue, in: runtime)
        }
      }
      // A promise settles through an actor off the JavaScript thread, but the decode must not.
      #expect(try await callback.invokeAsync(returning: ThreadRecordingInt.self).value == 5)
      #expect(ThreadRecordingInt.decodedOnJavaScriptThread == true)
    }
    await drain(testRuntime)
  }

  @Test
  func `invokeAsync doesn't keep the runtime alive while it awaits a promise`() async throws {
    let scheduler = TestRuntimeScheduler()
    let runtimes = RuntimesBox()
    let callback = try await scheduler.runIsolated {
      let owningRuntime = JavaScriptRuntime()
      let runtime = owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: scheduler.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnTestRuntime, to: UnsafeRawPointer.self)
        )
      }
      runtimes.owningRuntime = owningRuntime
      runtimes.runtime = runtime
      runtimes.weakRuntime = runtime
      return try runtime.eval("() => new Promise(() => {})").withUnownedValue(in: runtime) { unownedValue in
        try JavaScriptCallback.decode(unownedValue, in: runtime)
      }
    }
    // The promise never settles, so this call stays suspended for good.
    _ = Task {
      try await callback.invokeAsync()
    }
    try await Task.sleep(for: .milliseconds(200))
    // Drops the test's references and destroys the runtime, as a reload does.
    await scheduler.run {
      runtimes.runtime = nil
      runtimes.owningRuntime = nil
    }
    #expect(runtimes.weakRuntime == nil)
  }
}

/// Holds the runtimes that a test creates on the scheduler's thread, and a weak reference to watch
/// the non-owning one.
private final class RuntimesBox: @unchecked Sendable {
  var owningRuntime: JavaScriptRuntime?
  var runtime: JavaScriptRuntime?
  weak var weakRuntime: JavaScriptRuntime?
}

/// An `Int` that records whether it was decoded on the JavaScript thread.
private struct ThreadRecordingInt: JavaScriptDecodable {
  nonisolated(unsafe) static var decodedOnJavaScriptThread: Bool?
  let value: Int

  static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> ThreadRecordingInt
  {
    decodedOnJavaScriptThread = runtime.isOnJavaScriptThread()
    return ThreadRecordingInt(value: try Int.decode(value, in: runtime))
  }
}

// MARK: - Generated code

/// Non-`Sendable` types, the case that needs care when arguments cross to the JavaScript thread.
private final class Point: JavaScriptEncodable {
  let x: Int

  init(x: Int) {
    self.x = x
  }

  static func encode(_ value: Point, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return JavaScriptValue(runtime, value.x)
  }
}

private final class Size: JavaScriptDecodable {
  let width: Int

  init(width: Int) {
    self.width = width
  }

  static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Size {
    return Size(width: try Int.decode(value, in: runtime))
  }
}

/// Wrappers written exactly as the `@JS` macros generate them, so the suite stops compiling if the
/// callback's API drifts from the generated code.
@Suite
@JavaScriptActor
struct JavaScriptCallbackGeneratedCodeTests {
  let runtime = JavaScriptRuntime()

  private func callback(_ source: String) throws -> JavaScriptCallback {
    let value = try runtime.eval(source)
    return try value.withUnownedValue(in: runtime) { unownedValue in
      try JavaScriptCallback.decode(unownedValue, in: runtime)
    }
  }

  @Test
  func `throwing closure with a result`() throws {
    let arg0Callback = try callback("(point, factor) => point * factor")
    let arg0: (Point, Int) throws -> Size = { @Sendable p0, p1 in
      try arg0Callback.invokeBlocking(p0, p1, returning: Size.self)
    }
    #expect(try arg0(Point(x: 21), 2).width == 42)
  }

  @Test
  func `non-throwing Void closure`() throws {
    let arg0Callback = try callback("(point) => { globalThis.received = point }")
    let arg0: (Point) -> Void = { @Sendable p0 in
      arg0Callback.invokeDetached(p0)
    }
    arg0(Point(x: 3))
    #expect(try runtime.eval("globalThis.received").asInt() == 3)
  }

  @Test
  func `async throwing closure with a result`() async throws {
    let arg0Callback = try callback("async (point) => point + 1")
    let arg0: (Point) async throws -> Size = { @Sendable p0 in
      try await arg0Callback.invokeAsync(p0, returning: Size.self)
    }
    #expect(try await arg0(Point(x: 1)).width == 2)
  }

  @Test
  func `non-throwing async closure`() async throws {
    try runtime.eval("globalThis.ErrorUtils = { reportError(error) { globalThis.reported = error.message } }")
    let arg0Callback = try callback("async () => { throw new Error('async boom') }")
    let arg0: () async -> Void = { @Sendable in
      do {
        try await arg0Callback.invokeAsync()
      } catch {
        arg0Callback.reportError(error)
      }
    }
    await arg0()
    #expect(try runtime.eval("globalThis.reported").asString() == "async boom")
  }

  @Test
  func `borrowing and consuming parameters`() throws {
    let arg0Callback = try callback("(a, b) => a + b")
    let arg0: (borrowing Point, consuming Point) throws -> Size = { @Sendable p0, p1 in
      try arg0Callback.invokeBlocking(p0, p1, returning: Size.self)
    }
    #expect(try arg0(Point(x: 2), Point(x: 5)).width == 7)
  }
}
