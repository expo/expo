import ExpoModulesCore

public protocol Removable {
  func remove()
}

public class Subscription: Removable {
  private var handler: (() -> Void)?

  init(_ handler: @escaping () -> Void) {
    self.handler = handler
  }

  public func remove() {
    handler?()
    handler = nil
  }
}

public final class SharedState: SharedObject {
  private let lock = NSLock()
  private var value: Any?
  private var listeners: [(Any?) -> Void] = []

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
  }

  public func addListener(_ listener: @escaping (Any?) -> Void) -> Removable {
    lock.lock()
    listeners.append(listener)
    lock.unlock()

    return Subscription { [weak self] in
      guard let self = self else { return }
      self.lock.lock()
      self.listeners.removeAll { ObjectIdentifier($0 as AnyObject) == ObjectIdentifier(listener as AnyObject) }
      self.lock.unlock()
    }
  }
}
