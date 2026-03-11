import ExpoModulesCore

public final class SharedState: SharedObject {
  private let lock = NSLock()
  private let key: String
  private var value: Any?

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
    lock.lock()
    value = newValue
    lock.unlock()

    emit(event: "change", arguments: ["value": newValue])
    BrownfieldStateInternal.shared.notifySubscribers(key, newValue)
    BrownfieldStateInternal.shared.maybeNotifyKeyRecreated(key)
  }
}
