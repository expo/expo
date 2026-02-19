import Combine
import Foundation

public final class BrownfieldStateInternal {
  private static let lock = NSLock()
  private static var registry: [String: SharedState] = [:]

  public static func getOrCreate(_ key: String) -> SharedState {
    lock.lock()
    defer { lock.unlock() }

    if let existing = registry[key] {
      return existing
    }

    let state = SharedState()
    registry[key] = state

    return state
  }

  public static func get(_ key: String) -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return registry[key]?.get()
  }

  public static func set(_ key: String, _ value: Any?) {
    let state: SharedState
    lock.lock()

    if let existing = registry[key] {
      state = existing
    } else {
      state = SharedState()
      registry[key] = state
    }
    lock.unlock()

    state.set(value)
  }

  public static func subscribe(
    _ key: String,
    _ callback: @escaping (Any?) -> Void
  ) -> AnyCancellable {
    let state: SharedState
    lock.lock()

    if let existing = registry[key] {
      state = existing
    } else {
      state = SharedState()
      registry[key] = state
    }
    lock.unlock()

    return state.addListener(callback)
  }

  public static func delete(_ key: String) -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return registry.removeValue(forKey: key)?.get()
  }
}
