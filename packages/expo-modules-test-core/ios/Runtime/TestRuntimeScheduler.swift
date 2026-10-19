// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// A runtime scheduler that runs the scheduled work on a ``TestJavaScriptThread`` of its own. Pass
/// ``opaquePointer`` and ``dispatch`` to `AppContext.setRuntime(_:scheduler:dispatch:)` on that thread.
///
/// `expo-modules-jsi` has the same setup for its own tests in `apple/Tests/Support/TestRuntimeScheduler.swift`:
/// it is a SwiftPM package and cannot depend on this pod. Keep the two in sync.
internal final class TestRuntimeScheduler: @unchecked Sendable {
  let thread = TestJavaScriptThread()

  /// The handle the runtime passes back to ``dispatch``. A retained reference that is never released,
  /// like the handle React Native's host passes: the runtime may dispatch to it after this scheduler is
  /// gone, for example when a value is released on another thread at the end of a test. The thread
  /// drops work that arrives after it stopped.
  let opaquePointer: UnsafeMutableRawPointer

  init() {
    opaquePointer = Unmanaged.passRetained(thread).toOpaque()
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
  ) -> Void = { threadPointer, _, callback in
    guard let threadPointer else {
      return
    }
    let thread = Unmanaged<TestJavaScriptThread>.fromOpaque(threadPointer).takeUnretainedValue()
    thread.schedule(callback)
  }
