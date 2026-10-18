// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

/// Runs each test while no other test with this trait runs. Use it on suites that create a
/// `TestAppContext`: each one binds `JavaScriptActor` to its runtime, and the actor runs its jobs on
/// the thread of one runtime at a time. Tests that run at the same time would bind it in turn, and
/// one test's runtime would then be used from another test's thread.
struct BoundJavaScriptActorTrait: SuiteTrait, TestTrait, TestScoping {
  var isRecursive: Bool {
    return true
  }

  func provideScope(
    for test: Test,
    testCase: Test.Case?,
    performing function: @Sendable () async throws -> Void
  ) async throws {
    // The suite gets a scope too. Only its tests take the lock, or they would wait for the suite.
    guard !test.isSuite else {
      try await function()
      return
    }
    await boundJavaScriptActorLock.lock()
    do {
      try await function()
    } catch {
      await boundJavaScriptActorLock.unlock()
      throw error
    }
    await boundJavaScriptActorLock.unlock()
  }
}

extension Trait where Self == BoundJavaScriptActorTrait {
  /// See ``BoundJavaScriptActorTrait``.
  static var bindsJavaScriptActor: Self {
    return BoundJavaScriptActorTrait()
  }
}

/// A lock that waits without blocking a thread.
private actor AsyncLock {
  private var isLocked = false
  private var waiters: [CheckedContinuation<Void, Never>] = []

  func lock() async {
    if !isLocked {
      isLocked = true
      return
    }
    await withCheckedContinuation { continuation in
      waiters.append(continuation)
    }
  }

  func unlock() {
    if waiters.isEmpty {
      isLocked = false
    } else {
      // Hands the lock over to the next waiter, which stays locked.
      waiters.removeFirst().resume()
    }
  }
}

private let boundJavaScriptActorLock = AsyncLock()
