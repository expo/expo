import Combine
import Foundation

public class ListenerRef {
  let callback: (Any?) -> Void
  init(_ callback: @escaping (Any?) -> Void) { 
    self.callback = callback 
  }
}

public final class BrownfieldStateInternal {
  public static let shared = BrownfieldStateInternal()

  private let lock = NSLock()
  private var expoModule: ExpoBrownfieldStateModule?

  private var registry: [String: SharedState] = [:]
  private var subscriptions: [String: [ListenerRef]] = [:]
  private var deletedKeys: Set<String> = []

  public func getOrCreate(_ key: String) -> SharedState {
    lock.lock()
    defer { lock.unlock() }

    if let existing = registry[key] {
      return existing
    }

    let state = SharedState(key)
    registry[key] = state

    return state
  }

  public func get(_ key: String) -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return registry[key]?.get()
  }

  public func set(_ key: String, _ value: Any?) {
    let state: SharedState
    lock.lock()

    if let existing = registry[key] {
      state = existing
    } else {
      state = SharedState(key)
      registry[key] = state
    }
    lock.unlock()

    state.set(value)
  }

  public func subscribe(
    _ key: String,
    _ callback: @escaping (Any?) -> Void
  ) -> AnyCancellable {
    let listenerRef = ListenerRef(callback)

    lock.lock()
    subscriptions[key, default: []].append(listenerRef)
    lock.unlock()

    return AnyCancellable { [weak self] in
      self?.lock.lock()
      self?.subscriptions[key]?.removeAll { $0 === listenerRef }
      self?.lock.unlock()
    }
  }

  public func delete(_ key: String) -> Any? {
    lock.lock()
    defer { lock.unlock() }
    deletedKeys.insert(key)
    return registry.removeValue(forKey: key)?.get()
  }

  public func maybeNotifyKeyRecreated(_ key: String) {
    lock.lock()
    if !deletedKeys.contains(key) {
      lock.unlock()
      return
    }
    deletedKeys.remove(key)
    lock.unlock()

    expoModule?.notifyKeyRecreated(key)
  }

  public func setExpoModule(_ expoModule: ExpoBrownfieldStateModule?) {
    self.expoModule = expoModule
  }

  public func notifySubscribers(_ key: String, _ value: Any?) {
    var snapshot: [ListenerRef]
    lock.lock()
    snapshot = Array(subscriptions[key, default: []])
    lock.unlock()

    snapshot.forEach { $0.callback(value) }
  }
}
