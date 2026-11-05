// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
@testable import ExpoModulesCore

/// An app context for tests whose runtime has its own JavaScript thread, which drains the microtask
/// queue after each task like React Native does. Use it in place of `AppContext.create()` in tests
/// that call async functions or await promises: nothing drains the queue of that runtime, so an await
/// never completes, and its promises may settle concurrently with the test's JavaScript.
///
/// The app context owns its runtime and tears it down when it is deallocated, so keep it alive for as
/// long as the runtime is used, for example as a property of the test suite.
public final class TestAppContext: AppContext {
  private let scheduler = TestRuntimeScheduler()

  /// The Hermes runtime that the app context's runtime wraps.
  private var owningRuntime: JavaScriptRuntime?

  public init() {
    super.init(config: nil)
    ownsRuntime = true

    // A runtime treats the thread it is created on as its JavaScript thread.
    scheduler.thread.runAndWait {
      let owningRuntime = JavaScriptRuntime()
      owningRuntime.withUnsafePointee { runtimePointer in
        setRuntime(runtimePointer, scheduler: scheduler.opaquePointer, dispatch: scheduler.dispatch)
      }
      self.owningRuntime = owningRuntime

      // React Native drains the microtask queue after each task on the JavaScript thread. Without
      // it, promise reactions would never run.
      scheduler.thread.afterEachOperation = { [weak owningRuntime] in
        guard let owningRuntime else {
          return
        }
        JavaScriptActor.assumeIsolated {
          do {
            try owningRuntime.drainMicrotasks()
          } catch {
            // React Native reports these to its JavaScript error handler, which tests don't have.
            print("[TestAppContext] A microtask threw an error: \(error)")
          }
        }
      }
    }
  }

  /// The runtimes that `addRuntime()` attached to this app context.
  private var additionalRuntimes: [AdditionalRuntime] = []

  /// Creates another Hermes runtime with a JavaScript thread of its own and attaches it to this app
  /// context, like the worklet UI runtime that runs next to the main runtime in an app.
  public func addRuntime() throws -> JavaScriptRuntime {
    let additionalRuntime = AdditionalRuntime()
    var result: Result<JavaScriptRuntime, any Error>!

    additionalRuntime.scheduler.thread.runAndWait {
      result = Result {
        let runtime = additionalRuntime.start()
        try JavaScriptActor.assumeIsolated {
          try attach(runtime: runtime)
        }
        return runtime
      }
    }
    additionalRuntimes.append(additionalRuntime)
    return try result.get()
  }

  deinit {
    for additionalRuntime in additionalRuntimes {
      additionalRuntime.stop()
    }

    // Release the runtime objects before the Hermes runtime, on the JavaScript thread.
    scheduler.thread.runAndWait {
      destroy()
      owningRuntime = nil
    }
    scheduler.thread.stopWhenIdle()
  }
}

/// A runtime that `TestAppContext.addRuntime()` creates, with a JavaScript thread of its own.
private final class AdditionalRuntime {
  let scheduler = TestRuntimeScheduler()

  /// The Hermes runtime that `runtime` wraps.
  private var owningRuntime: JavaScriptRuntime?

  /// The runtime that is attached to the app context. It schedules work on the thread of `scheduler`.
  private(set) var runtime: JavaScriptRuntime?

  /// Creates the runtime. Call it on the thread of `scheduler`, because a runtime treats the thread
  /// it is created on as its JavaScript thread.
  func start() -> JavaScriptRuntime {
    let owningRuntime = JavaScriptRuntime()
    let runtime = owningRuntime.withUnsafePointee { runtimePointer in
      JavaScriptRuntime(unsafePointer: runtimePointer, scheduler: scheduler.opaquePointer, dispatch: scheduler.dispatch)
    }
    self.owningRuntime = owningRuntime
    self.runtime = runtime

    scheduler.thread.afterEachOperation = { [weak owningRuntime] in
      guard let owningRuntime else {
        return
      }
      JavaScriptActor.assumeIsolated {
        do {
          try owningRuntime.drainMicrotasks()
        } catch {
          print("[TestAppContext] A microtask threw an error: \(error)")
        }
      }
    }
    return runtime
  }

  /// Releases the runtime on its thread and stops the thread.
  func stop() {
    scheduler.thread.runAndWait {
      runtime = nil
      owningRuntime = nil
    }
    let scheduler = self.scheduler
    scheduler.thread.schedule {
      _ = scheduler
    }
    scheduler.thread.stopWhenIdle()
  }
}
