import ExpoModulesCore

final class ActivationSignal: Sendable {
  private enum State {
    case pending([UInt64: CheckedContinuation<Void, Error>])
    case finished(Result<Void, Error>)
  }

  private struct Storage {
    var nextWaiterID: UInt64 = 0
    var state: State = .pending([:])
  }

  private let storage = Mutex(Storage())

  func finish(_ result: Result<Void, Error>) {
    let waiters = storage.withLock { storage -> [CheckedContinuation<Void, Error>] in
      guard case .pending(let waiters) = storage.state else {
        return []
      }
      storage.state = .finished(result)
      return Array(waiters.values)
    }
    for waiter in waiters {
      waiter.resume(with: result)
    }
  }

  var isPending: Bool {
    storage.withLock { storage in
      if case .pending = storage.state {
        return true
      }
      return false
    }
  }

  var waiterCount: Int {
    storage.withLock { storage in
      if case .pending(let waiters) = storage.state {
        return waiters.count
      }
      return 0
    }
  }

  func wait() async throws {
    let id = storage.withLock { storage in
      storage.nextWaiterID += 1
      return storage.nextWaiterID
    }
    try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
        let result = storage.withLock { storage -> Result<Void, Error>? in
          switch storage.state {
          case .finished(let result):
            return result
          case .pending(var waiters):
            // onCancel may already have run; it can only remove waiters registered before it.
            if Task.isCancelled {
              return .failure(CancellationError())
            }
            waiters[id] = continuation
            storage.state = .pending(waiters)
            return nil
          }
        }
        if let result {
          continuation.resume(with: result)
        }
      }
    } onCancel: {
      let waiter = storage.withLock { storage -> CheckedContinuation<Void, Error>? in
        guard case .pending(var waiters) = storage.state, let waiter = waiters.removeValue(forKey: id) else {
          return nil
        }
        storage.state = .pending(waiters)
        return waiter
      }
      waiter?.resume(throwing: CancellationError())
    }
  }
}
