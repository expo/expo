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

  internal enum State {
    case pending(CheckedContinuation<SettledValue, any Error>?)
    case fulfilled(SettledValue)
    case rejected(JavaScriptError)
  }

  internal var state: State = .pending(nil)

  /// Whether the first `await()` has taken `handOut`.
  private var isHandedOut = false

  /// Returns the ref to read the settled value from, and whether the caller owns it. An owned ref is
  /// the first read and can be taken as is; otherwise the caller has to clone the value on the
  /// JavaScript thread.
  public func getValue() async throws(JavaScriptError) -> (ref: JavaScriptValue.Ref, isOwned: Bool) {
    switch state {
    case .fulfilled(let settled):
      return read(settled)

    case .rejected(let error):
      throw error

    case .pending(nil):
      do {
        let settled = try await withCheckedThrowingContinuation { continuation in
          state = .pending(continuation)
        }
        return read(settled)
      } catch let error as JavaScriptError {
        throw error
      } catch {
        // The continuation is only ever resumed with a `JavaScriptError` (see `reject`).
        preconditionFailure("Promise continuation resumed with an unexpected error: \(error)")
      }

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

  internal func reject(_ error: sending JavaScriptError) {
    switch state {
    case .pending(let continuation?):
      continuation.resume(throwing: error)
      state = .rejected(error)

    case .pending(nil):
      state = .rejected(error)

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
