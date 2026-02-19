import Combine
import Foundation

public final class BrownfieldStateInternal {
  private static let lock = NSLock()
  private static var registry: [String: SharedState] = [:]
  private static var subscriptions: [String: [(Any?) -> Void]] = [:]

  public static func getOrCreate(_ key: String) -> SharedState {
    lock.lock()
    defer { lock.unlock() }

    if let existing = registry[key] {
      return existing
    }

    let state = SharedState(key: key)
    registry[key] = state

    return state
  }

  public static func get(_ key: String) -> Any? {
    lock.lock()
    let state = registry[key]
    lock.unlock()
    return state?.get()
  }

  public static func set(_ key: String, _ value: Any?) {
    let state: SharedState
    lock.lock()

    if let existing = registry[key] {
      state = existing
    } else {
      state = SharedState(key: key)
      registry[key] = state
    }
    lock.unlock()

    state.set(value)
  }

  public static func subscribe(
    _ key: String,
    _ callback: @escaping (Any?) -> Void
  ) -> AnyCancellable {
    lock.lock()
    subscriptions[key, default: []].append(callback)
    lock.unlock()

    return AnyCancellable {
      lock.lock()
      subscriptions[key]?.removeAll { ObjectIdentifier($0 as AnyObject) == ObjectIdentifier(callback as AnyObject) }
      lock.unlock()
    }
  }

  public static func delete(_ key: String) -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return registry.removeValue(forKey: key)?.get()
  }

  public static func notifySubscribers(_ key: String, _ value: Any?) {
    var subscriberSnapshot: [(Any?) -> Void]
    
    lock.lock()
    subscriberSnapshot = subscriptions[key] ?? []
    lock.unlock()

    subscriberSnapshot.forEach { $0(value) }
  }
}
