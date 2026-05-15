internal actor DeferredPromise {
  internal enum State {
    case pending(CheckedContinuation<JavaScriptValue, Never>?)
    case fulfilled(JavaScriptValue)
    case rejected(JavaScriptValue)
  }

  internal var state: State = .pending(nil)

  public func getValue() async throws(JavaScriptValue) -> sending JavaScriptValue {
    switch state {
    case .fulfilled(let value):
      return value

    case .rejected(let error):
      throw error

    case .pending(nil):
      return await withCheckedContinuation { continuation in
        state = .pending(continuation)
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

  internal func reject(_ error: sending JavaScriptValue) {
    switch state {
    case .pending(let continuation?):
      continuation.resume(returning: error)
      state = .rejected(error)

    case .pending(nil):
      state = .rejected(error)

    default:
      break
    }
  }
}
