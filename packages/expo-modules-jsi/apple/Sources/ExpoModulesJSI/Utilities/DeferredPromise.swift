import os

internal final class DeferredPromise: Sendable {
  /// The value a promise was fulfilled with, in two refs made on the JavaScript thread when the
  /// promise settles. `handOut` holds the value itself and goes to the first `await()`, which moves it
  /// out without touching the runtime. `kept` holds a copy for any later `await()`, which clones it on
  /// the JavaScript thread. Refs give the non-copyable value a shareable owner that can cross threads.
  internal struct SettledValue: Sendable {
    let handOut: JavaScriptValue.Ref
    let kept: JavaScriptValue.Ref
  }

  private struct State: Sendable {
    enum Status: Sendable {
      case pending([CheckedContinuation<SettledValue, any Error>])
      case fulfilled(SettledValue)
      case rejected(any Error)
    }

    var status: Status = .pending([])
    /// Whether the first `await()` has taken `handOut`.
    var isHandedOut = false
  }

  private let state = OSAllocatedUnfairLock(initialState: State())

  /// Returns the ref to read the settled value from, and whether the caller owns it. An owned ref is
  /// the first read and can be taken as is; otherwise the caller has to clone the value on the
  /// JavaScript thread.
  public func getValue() async throws -> (ref: JavaScriptValue.Ref, isOwned: Bool) {
    let immediate: Result<(ref: JavaScriptValue.Ref, isOwned: Bool), any Error>? = state.withLock { state in
      switch state.status {
      case .fulfilled(let settled):
        return .success(Self.read(settled, state: &state))
      case .rejected(let error):
        return .failure(error)
      case .pending:
        return nil
      }
    }
    if let immediate {
      return try immediate.get()
    }
    let settled = try await withCheckedThrowingContinuation { continuation in
      let alreadySettled: Result<SettledValue, any Error>? = state.withLock { state in
        switch state.status {
        case .pending(var continuations):
          continuations.append(continuation)
          state.status = .pending(continuations)
          return nil
        case .fulfilled(let settled):
          return .success(settled)
        case .rejected(let error):
          return .failure(error)
        }
      }
      if let alreadySettled {
        continuation.resume(with: alreadySettled)
      }
    }
    return state.withLock { state in
      Self.read(settled, state: &state)
    }
  }

  internal func resolve(_ settled: SettledValue) {
    let continuations: [CheckedContinuation<SettledValue, any Error>] = state.withLock { state in
      guard case .pending(let continuations) = state.status else {
        return []
      }
      state.status = .fulfilled(settled)
      return continuations
    }
    for continuation in continuations {
      continuation.resume(returning: settled)
    }
  }

  internal func reject(_ error: any Error) {
    let continuations: [CheckedContinuation<SettledValue, any Error>] = state.withLock { state in
      guard case .pending(let continuations) = state.status else {
        return []
      }
      state.status = .rejected(error)
      return continuations
    }
    for continuation in continuations {
      continuation.resume(throwing: error)
    }
  }

  /// Called synchronously during runtime teardown (while the runtime is still valid) to wake any
  /// pending awaiters with ``JavaScriptCallback/RuntimeLostError`` and drop any stored
  /// ``JavaScriptError`` or settled refs before the runtime is destroyed.
  internal func releaseOnTeardown() {
    let (continuations, droppedError): ([CheckedContinuation<SettledValue, any Error>], (any Error)?) = state.withLock {
      state in
      switch state.status {
      case .pending(let continuations):
        state.status = .rejected(JavaScriptCallback.RuntimeLostError())
        return (continuations, nil)
      case .fulfilled:
        state.status = .rejected(JavaScriptCallback.RuntimeLostError())
        return ([], nil)
      case .rejected(let error):
        state.status = .rejected(JavaScriptCallback.RuntimeLostError())
        return ([], error)
      }
    }
    // Destroy the error outside the lock, synchronously while the runtime is still alive.
    _ = droppedError
    for continuation in continuations {
      continuation.resume(throwing: JavaScriptCallback.RuntimeLostError())
    }
  }

  private static func read(_ settled: SettledValue, state: inout State) -> (ref: JavaScriptValue.Ref, isOwned: Bool) {
    if state.isHandedOut {
      return (settled.kept, false)
    }
    state.isHandedOut = true
    return (settled.handOut, true)
  }
}
