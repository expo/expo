internal actor DeferredPromise {
  // The settled value travels through a `JavaScriptValue.Ref`: the continuation and the stored state
  // both need to hold it, and the reference gives a non-copyable value a shareable owner. The state
  // keeps the value until the promise is released on the JavaScript thread, so the value handed to the
  // awaiting caller is never the last owner of the engine handle: destroying a `jsi::Value` off the
  // JavaScript thread is not safe.
  internal enum State {
    case pending(CheckedContinuation<JavaScriptValue.Ref, any Error>?)
    case fulfilled(JavaScriptValue.Ref)
    case rejected(JavaScriptError)
  }

  internal var state: State = .pending(nil)

  public func getValue() async throws(JavaScriptError) -> sending JavaScriptValue {
    switch state {
    case .fulfilled(let ref):
      return takeValue(from: ref)

    case .rejected(let error):
      throw error

    case .pending(nil):
      do {
        let ref = try await withCheckedThrowingContinuation { continuation in
          state = .pending(continuation)
        }
        return takeValue(from: ref)
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

  internal func resolve(_ ref: JavaScriptValue.Ref) {
    switch state {
    case .pending(let continuation?):
      continuation.resume(returning: ref)
      state = .fulfilled(ref)

    case .pending(nil):
      state = .fulfilled(ref)

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

  /// Reads the value out of the reference without emptying it, so the stored state keeps owning the
  /// engine handle (see the note on `State`). The reference is shared between the continuation and the
  /// stored state; a `getValue()` that finds it empty is a programmer error, like awaiting a pending
  /// promise twice.
  private func takeValue(from ref: JavaScriptValue.Ref) -> sending JavaScriptValue {
    guard let value = ref.withValue({ (value: borrowing JavaScriptValue?) in copy value }) else {
      preconditionFailure("Promise awaited more than once")
    }
    return value
  }
}
