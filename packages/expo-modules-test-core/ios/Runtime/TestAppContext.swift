// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
@testable import ExpoModulesCore

/// An app context for tests, whose runtime has a JavaScript thread of its own. Use it in place of
/// `AppContext.create()` in tests that call async functions.
///
/// The runtime of `AppContext.create()` has no JavaScript thread: it runs scheduled work inline on
/// whatever thread calls `schedule`. Once an async function body resumes on a cooperative thread, it
/// settles its promise from there, concurrently with the test that may still be evaluating JavaScript
/// on the same runtime, which Hermes does not survive. Here the scheduled work runs on a dedicated
/// thread instead, and `JavaScriptRuntime.evalAsync` called from the test evaluates there too.
public final class TestAppContext: AppContext {
  private let scheduler = TestRuntimeScheduler()

  /// Owns the Hermes runtime that the app context's runtime wraps.
  private var owningRuntime: JavaScriptRuntime?

  public init() {
    super.init(config: nil)

    // The runtime is created on the JavaScript thread: `JavaScriptRuntime` takes the thread it is
    // created on as its JavaScript thread, and setting the app context's runtime installs the core
    // object, which has to happen there as well.
    scheduler.thread.runAndWait {
      let owningRuntime = JavaScriptRuntime()
      owningRuntime.withUnsafePointee { runtimePointer in
        setRuntime(runtimePointer, scheduler: scheduler.opaquePointer, dispatch: scheduler.dispatch)
      }
      self.owningRuntime = owningRuntime
    }
  }

  deinit {
    // Tear down on the JavaScript thread, after the work already queued there: release the runtime
    // objects, then the Hermes runtime they belong to.
    scheduler.thread.runAndWait {
      destroy()
      owningRuntime = nil
    }
    // Work scheduled from now on still reaches the scheduler, so keep it alive until the thread
    // runs out of work.
    let scheduler = self.scheduler
    scheduler.thread.schedule {
      _ = scheduler
    }
    scheduler.thread.stopWhenIdle()
  }
}
