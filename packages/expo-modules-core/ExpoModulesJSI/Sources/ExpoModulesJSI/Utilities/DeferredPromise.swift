internal actor DeferredPromise {
  internal typealias Value = JavaScriptValue.Ref

  internal enum State {
    case pending(CheckedContinuation<Value, Never>?)
    case fulfilled(Value)
    case rejected(Value)
  }

  internal var state: State = .pending(nil)

  public func getValue() async throws -> sending Value {
    switch state {
    case .fulfilled(let value):
      return value

    case .rejected(let error):
      return error

    case .pending(nil):
      return await withCheckedContinuation { continuation in
        state = .pending(continuation)
      }

    case .pending(.some):
      preconditionFailure("Promise awaited more than once")
    }
  }

  internal func resolve(_ value: sending Value) {
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

  internal func reject(_ error: sending Value) {
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
