// Copyright 2026-present 650 Industries. All rights reserved.

/// A runtime that more than one thread runs code in, such as the worklets UI runtime, which the JavaScript thread
/// can run worklets in too. Code that keeps state between JSI calls, such as the caches of ``JavaScriptRuntime``,
/// runs on such a runtime only while it holds the runtime's lock.
@_spi(Internal)
public protocol JavaScriptRuntimeLocking: AnyObject {
  /// Runs `body` while holding the runtime's lock, and returns `true`. Returns `false` without running `body`
  /// when the runtime is gone.
  func withLock(_ body: () -> Void) -> Bool
}
