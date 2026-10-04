// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Records whether the JavaScript function a callback wraps ran on the runtime's JavaScript thread.
private final class ThreadFlag: @unchecked Sendable {
  var value: Bool?
}

private struct NativeError: Error, CustomStringConvertible {
  var description: String {
    return "native failure"
  }
}

/// A scheduler trampoline that drops every task without running it, the way the React Native
/// dispatch does once React has destroyed its scheduler.
private let dropEveryTask:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { _, _, _ in }

@Suite
@JavaScriptActor
struct JavaScriptCallbackTests {
  let runtime = JavaScriptRuntime()

  /// Evaluates `source` and wraps the resulting value in a callback, the way generated bindings do
  /// with a `@JS` function's closure argument.
  private func callback(_ source: String) throws -> JavaScriptCallback {
    let value = try runtime.eval(source)
    return try value.withUnownedValue(in: runtime) { unownedValue in
      try JavaScriptCallback.decode(unownedValue, in: runtime)
    }
  }

  /// Installs a stand-in for React Native's `ErrorUtils` that stores the reported error's message.
  private func installErrorUtils() throws {
    try runtime.eval("globalThis.ErrorUtils = { reportError(error) { globalThis.reported = error.message } }")
  }

  // MARK: - Creating

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
  func `invokeBlocking passes the encoded arguments and decodes the result`() throws {
    let callback = try callback("(a, b) => a + b")
    let sum = try callback.invokeBlocking { runtime in
      try [Int.encode(2, in: runtime), Int.encode(3, in: runtime)]
    } decodeResult: { result, runtime in
      try Int.decode(result, in: runtime)
    }
    #expect(sum == 5)
  }

  @Test
  func `invokeBlocking without a result calls the function`() throws {
    let callback = try callback("(value) => { globalThis.received = value }")
    try callback.invokeBlocking { runtime in
      try [String.encode("hello", in: runtime)]
    }
    #expect(try runtime.eval("globalThis.received").asString() == "hello")
  }

  @Test
  func `invokeBlocking rethrows a JavaScript exception`() throws {
    let callback = try callback("() => { throw new Error('boom') }")
    #expect(throws: (any Error).self) {
      try callback.invokeBlocking { _ in [] }
    }
  }

  // MARK: - invokeDetached

  @Test
  func `invokeDetached calls the function`() throws {
    let callback = try callback("(value) => { globalThis.received = value }")
    callback.invokeDetached { runtime in
      try [Int.encode(7, in: runtime)]
    }
    #expect(try runtime.eval("globalThis.received").asInt() == 7)
  }

  @Test
  func `invokeDetached reports a JavaScript exception through ErrorUtils`() throws {
    try installErrorUtils()
    let callback = try callback("() => { throw new Error('boom') }")
    callback.invokeDetached { _ in [] }
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
    let doubled = try await callback.invokeAsync { runtime in
      try [Int.encode(4, in: runtime)]
    } decodeResult: { result, runtime in
      try Int.decode(result, in: runtime)
    }
    #expect(doubled == 8)
  }

  @Test
  func `invokeAsync decodes a value returned without a promise`() async throws {
    let callback = try callback("(value) => value + '!'")
    let result = try await callback.invokeAsync { runtime in
      try [String.encode("hi", in: runtime)]
    } decodeResult: { result, runtime in
      try String.decode(result, in: runtime)
    }
    #expect(result == "hi!")
  }

  @Test
  func `invokeAsync throws when the returned promise rejects`() async throws {
    let callback = try callback("async () => { throw new Error('rejected') }")
    await #expect(throws: (any Error).self) {
      try await callback.invokeAsync { _ in [] }
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
    // The teardown sweep, which the runtime runs before it is destroyed.
    runtime.longLivedObjects.clear()
    #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      try callback.invokeBlocking { _ in [] }
    }
  }
}

/// Calls made from threads other than the runtime's JavaScript thread. A standalone runtime runs
/// scheduled work inline on the calling thread, so these tests use a `TestRuntimeScheduler`, which
/// gives the runtime a JavaScript thread of its own.
@Suite
struct JavaScriptCallbackThreadingTests {
  /// Waits until the scheduler's thread has released every task that holds the callback, and then
  /// until the release task the callback's `deinit` scheduled has run. `TestRuntimeScheduler` hands
  /// the runtime an unretained pointer, so a callback released after the test drops the scheduler
  /// would schedule on a freed object. (React Native's scheduler handle is never freed.)
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
          continuation.resume(
            with: Result {
              try callback.invokeBlocking { _ in
                []
              } decodeResult: { result, runtime in
                try Int.decode(result, in: runtime)
              }
            }
          )
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

      let result = try await callback.invokeAsync { _ in
        []
      } decodeResult: { result, runtime in
        try Int.decode(result, in: runtime)
      }
      #expect(result == 42)
      #expect(flag.value == true)
    }
    await drain(testRuntime)
  }

  @Test
  func `a dropped task throws RuntimeLostError instead of waiting forever`() async throws {
    let scheduler = TestRuntimeScheduler()
    let owningRuntime = await scheduler.run {
      JavaScriptRuntime()
    }
    // A runtime whose JavaScript thread is the scheduler's thread, but whose dispatch drops every
    // task, so any call from another thread can never run.
    let runtime = await scheduler.run {
      owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: scheduler.opaquePointer,
          dispatch: unsafeBitCast(dropEveryTask, to: UnsafeRawPointer.self)
        )
      }
    }
    let callback = try await scheduler.runIsolated {
      let function = try runtime.eval("() => 1")
      return try function.withUnownedValue(in: runtime) { unownedValue in
        try JavaScriptCallback.decode(unownedValue, in: runtime)
      }
    }

    await #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      try await callback.invokeAsync { _ in [] }
    }
    let blockingResult: Result<Void, any Error> = await withCheckedContinuation { continuation in
      DispatchQueue.global().async {
        continuation.resume(returning: Result { try callback.invokeBlocking { _ in [] } })
      }
    }
    #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      try blockingResult.get()
    }
    withExtendedLifetime((owningRuntime, runtime)) {}
  }
}

// MARK: - Generated code

/// Non-`Sendable` types, the case that needs the `Argument` box under Swift 6 region checking.
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

/// The wrappers below are written exactly as `@JS` bindings generate them for a closure argument, so
/// this suite fails to compile if the callback's API stops matching what the macros emit.
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
    let arg0Callback = try callback("(point) => point * 2")
    let arg0: (Point) throws -> Size = { @Sendable p0 in
      let a0 = JavaScriptCallback.Argument(p0)
      return try arg0Callback.invokeBlocking { runtime in
        try [Point.encode(a0.value, in: runtime)]
      } decodeResult: { result, runtime in
        try Size.decode(result, in: runtime)
      }
    }
    #expect(try arg0(Point(x: 21)).width == 42)
  }

  @Test
  func `non-throwing Void closure`() throws {
    let arg0Callback = try callback("(point) => { globalThis.received = point }")
    let arg0: (Point) -> Void = { @Sendable p0 in
      let a0 = JavaScriptCallback.Argument(p0)
      arg0Callback.invokeDetached { runtime in
        try [Point.encode(a0.value, in: runtime)]
      }
    }
    arg0(Point(x: 3))
    #expect(try runtime.eval("globalThis.received").asInt() == 3)
  }

  @Test
  func `async throwing closure with a result`() async throws {
    let arg0Callback = try callback("async (point) => point + 1")
    let arg0: (Point) async throws -> Size = { @Sendable p0 in
      let a0 = JavaScriptCallback.Argument(p0)
      return try await arg0Callback.invokeAsync { runtime in
        try [Point.encode(a0.value, in: runtime)]
      } decodeResult: { result, runtime in
        try Size.decode(result, in: runtime)
      }
    }
    #expect(try await arg0(Point(x: 1)).width == 2)
  }

  @Test
  func `non-throwing async closure`() async throws {
    try runtime.eval("globalThis.ErrorUtils = { reportError(error) { globalThis.reported = error.message } }")
    let arg0Callback = try callback("async () => { throw new Error('async boom') }")
    let arg0: () async -> Void = { @Sendable in
      do {
        try await arg0Callback.invokeAsync { runtime in
          []
        }
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
      let a0 = JavaScriptCallback.Argument(copy p0)
      let a1 = JavaScriptCallback.Argument(copy p1)
      return try arg0Callback.invokeBlocking { runtime in
        try [Point.encode(a0.value, in: runtime), Point.encode(a1.value, in: runtime)]
      } decodeResult: { result, runtime in
        try Size.decode(result, in: runtime)
      }
    }
    #expect(try arg0(Point(x: 2), Point(x: 5)).width == 7)
  }
}
