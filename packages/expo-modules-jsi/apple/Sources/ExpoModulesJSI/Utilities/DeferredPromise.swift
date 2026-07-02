internal actor DeferredPromise {
  internal enum State {
    case pending(CheckedContinuation<JavaScriptValue, any Error>?)
    case fulfilled(JavaScriptValue)
    case rejected(JavaScriptError)
  }

  internal var state: State = .pending(nil)

  public func getValue() async throws(JavaScriptError) -> sending JavaScriptValue {
    switch state {
    case .fulfilled(let value):
      return value

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

  internal func resolve(_ value: sending JavaScriptValue) {
    switch state {
    case .pending(let continuation?):
      continuation.resume(returning: value)
      state = .fulfilled(value)

    case .pending(nil):
      state = .fulfilled(value)

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
