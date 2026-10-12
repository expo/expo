internal actor DeferredPromise {
  // The settled value travels through a `JavaScriptValue.Ref`: the continuation and the stored state
  // both need to hold it, and the reference gives a non-copyable value a shareable owner. The state
  // keeps the value, and `getValue()` hands out the reference rather than a value: reading the value
  // out means cloning the engine value, which touches the runtime, so `JavaScriptPromise.await()` does
  // it on the JavaScript thread instead of on this actor.
  internal enum State {
    case pending(CheckedContinuation<JavaScriptValue.Ref, any Error>?)
    case fulfilled(JavaScriptValue.Ref)
    case rejected(JavaScriptError)
  }

  internal var state: State = .pending(nil)

  public func getValue() async throws(JavaScriptError) -> JavaScriptValue.Ref {
    switch state {
    case .fulfilled(let ref):
      return ref

    case .rejected(let error):
      throw error

    case .pending(nil):
      do {
        return try await withCheckedThrowingContinuation { continuation in
          state = .pending(continuation)
        }
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
}
