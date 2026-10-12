import ExpoModulesCore

@SharedObject
public final class SharedState: SharedObject {
  private let lock = NSLock()
  private let key: String
  private var value: Any?

  @JS
  nonisolated public init(_ key: String) {
    self.key = key
    super.init()
  }

  @JS
  nonisolated public func get() -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return value
  }

  public func set(_ newValue: Any?) {
    lock.lock()
    value = newValue
    lock.unlock()

    emit(event: "change", payload: ["value": newValue])
    BrownfieldStateInternal.shared.notifySubscribers(key, newValue)
    BrownfieldStateInternal.shared.maybeNotifyKeyRecreated(key)
  }

  @JS
  func set(fromJS value: borrowing JavaScriptValue) {
    set(value.isUndefined() || value.isNull() ? nil : value.getAny())
  }
}
