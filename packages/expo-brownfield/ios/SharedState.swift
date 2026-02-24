import Combine
import ExpoModulesCore

public final class SharedState: SharedObject {
  private let lock = NSLock()
  private let key: String
  private var value: Any?
  private var listeners: [(Any?) -> Void] = []

  public init(_ key: String) {
    self.key = key
    super.init()
  }

  public func get() -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return value
  }

  public func set(_ newValue: Any?) {
    let listenersSnapshot: [(Any?) -> Void]
    lock.lock()
    value = newValue
    listenersSnapshot = listeners
    lock.unlock()

    emit(event: "change", arguments: ["value": newValue])
    listenersSnapshot.forEach { $0(newValue) }
    BrownfieldStateInternal.shared.maybeNotifyKeyRecreated(self.key)
  }

  public func addListener(_ listener: @escaping (Any?) -> Void) -> AnyCancellable {
    lock.lock()
    listeners.append(listener)
    lock.unlock()

    return AnyCancellable { [weak self] in
      guard let self = self else { return }
      self.lock.lock()
      self.listeners.removeAll { ObjectIdentifier($0 as AnyObject) == ObjectIdentifier(listener as AnyObject) }
      self.lock.unlock()
    }
  }
}
