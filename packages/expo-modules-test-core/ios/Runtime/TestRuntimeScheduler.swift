// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// A runtime scheduler that runs the scheduled work on a ``JavaScriptTestThread`` of its own. Pass
/// ``opaquePointer`` and ``dispatch`` to `AppContext.setRuntime(_:scheduler:dispatch:)` on that thread.
///
/// `expo-modules-jsi` has the same setup for its own tests in `apple/Tests/Support/TestRuntimeScheduler.swift`:
/// it is a SwiftPM package and cannot depend on this pod. Keep the two in sync.
internal final class TestRuntimeScheduler: @unchecked Sendable {
  let thread = JavaScriptTestThread()

  /// The handle the runtime passes back to ``dispatch``. Unretained: keep the scheduler alive for as
  /// long as the runtime can schedule work.
  var opaquePointer: UnsafeMutableRawPointer {
    return Unmanaged.passUnretained(self).toOpaque()
  }

  /// The `void (*)(void *scheduler, int priority, void (^callback)())` function the runtime calls to
  /// schedule work.
  var dispatch: UnsafeRawPointer {
    return unsafeBitCast(scheduleOnTestRuntimeScheduler, to: UnsafeRawPointer.self)
  }
}

private let scheduleOnTestRuntimeScheduler:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { schedulerPointer, _, callback in
    guard let schedulerPointer else {
      return
    }
    let scheduler = Unmanaged<TestRuntimeScheduler>.fromOpaque(schedulerPointer).takeUnretainedValue()
    scheduler.thread.schedule(callback)
  }
