import os

internal actor DeferredPromise {
  /// The value a promise was fulfilled with, in two refs made on the JavaScript thread when the
  /// promise settles. `handOut` holds the value itself and goes to the first `await()`, which moves it
  /// out without touching the runtime. `kept` holds a copy for any later `await()`, which clones it on
  /// the JavaScript thread. Refs give the non-copyable value a shareable owner that can cross to this
  /// actor and back.
  internal struct SettledValue: Sendable {
    let handOut: JavaScriptValue.Ref
    let kept: JavaScriptValue.Ref
  }

  /// Holds the `JavaScriptError` a promise rejected with behind a lock so `LongLivedState.allowRelease()`
  /// can release its `jsi::JSError` on the teardown sweep even if this actor or an in-flight `Task`
  /// is still referenced off-thread.
  internal final class SettledError: Sendable {
    private let storage: OSAllocatedUnfairLock<JavaScriptError?>

    init(_ error: JavaScriptError) {
      self.storage = OSAllocatedUnfairLock(initialState: error)
    }

    func error() -> JavaScriptError? {
      return storage.withLock { $0 }
    }

    func release() {
      let released = storage.withLock { error -> JavaScriptError? in
        defer { error = nil }
        return error
      }
      _ = released
    }
  }

  internal enum State {
    case pending(CheckedContinuation<SettledValue, any Error>?)
    case fulfilled(SettledValue)
    case rejected(SettledError)
  }

  internal var state: State = .pending(nil)

  /// Whether the first `await()` has taken `handOut`.
  private var isHandedOut = false

  /// Returns the ref to read the settled value from, and whether the caller owns it. An owned ref is
  /// the first read and can be taken as is; otherwise the caller has to clone the value on the
  /// JavaScript thread.
  public func getValue() async throws -> (ref: JavaScriptValue.Ref, isOwned: Bool) {
    switch state {
    case .fulfilled(let settled):
      return read(settled)

    case .rejected(let settledError):
      guard let error = settledError.error() else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      throw error

    case .pending(nil):
      let settled = try await withCheckedThrowingContinuation { continuation in
        state = .pending(continuation)
      }
      return read(settled)

    case .pending(.some):
      preconditionFailure("Promise awaited more than once")
    }
  }

  internal func resolve(_ settled: SettledValue) {
    switch state {
    case .pending(let continuation?):
      continuation.resume(returning: settled)
      state = .fulfilled(settled)

    case .pending(nil):
      state = .fulfilled(settled)

    default:
      break
    }
  }

  internal func reject(_ settledError: SettledError) {
    switch state {
    case .pending(let continuation?):
      continuation.resume(throwing: settledError.error() ?? JavaScriptCallback.RuntimeLostError())
      state = .rejected(settledError)

    case .pending(nil):
      state = .rejected(settledError)

    default:
      break
    }
  }

  private func read(_ settled: SettledValue) -> (ref: JavaScriptValue.Ref, isOwned: Bool) {
    if isHandedOut {
      return (settled.kept, false)
    }
    isHandedOut = true
    return (settled.handOut, true)
  }
}
