// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
@testable import ExpoModulesCore

/// An app context for tests whose runtime has its own JavaScript thread. Use it in place of
/// `AppContext.create()` in tests that call async functions, which otherwise may settle their
/// promises concurrently with the test's JavaScript.
public final class TestAppContext: AppContext {
  private let scheduler = TestRuntimeScheduler()

  /// The Hermes runtime that the app context's runtime wraps.
  private var owningRuntime: JavaScriptRuntime?

  public init() {
    super.init(config: nil)

    // A runtime treats the thread it is created on as its JavaScript thread.
    scheduler.thread.runAndWait {
      let owningRuntime = JavaScriptRuntime()
      owningRuntime.withUnsafePointee { runtimePointer in
        setRuntime(runtimePointer, scheduler: scheduler.opaquePointer, dispatch: scheduler.dispatch)
      }
      self.owningRuntime = owningRuntime
    }
  }

  deinit {
    // Release the runtime objects before the Hermes runtime, on the JavaScript thread.
    scheduler.thread.runAndWait {
      destroy()
      owningRuntime = nil
    }
    // Keep the scheduler alive until the thread runs out of work.
    let scheduler = self.scheduler
    scheduler.thread.schedule {
      _ = scheduler
    }
    scheduler.thread.stopWhenIdle()
  }
}
