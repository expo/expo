import Combine
internal import ExpoBrownfield

public struct ${{prefix}}BrownfieldState {
  public static func get(_ key: String) -> Any? {
    return BrownfieldStateInternal.shared.get(key)
  }

  public static func set(_ key: String, _ value: Any?) {
    BrownfieldStateInternal.shared.set(key, value)
  }

  @discardableResult
  public static func subscribe(
    _ key: String,
    _ callback: @escaping (Any?) -> Void
  ) -> AnyCancellable {
    return BrownfieldStateInternal.shared.subscribe(key, callback)
  }

  @discardableResult
  public static func subscribe<T>(
    _ key: String,
    as type: T.Type,
    _ callback: @escaping (T) -> Void
  ) -> AnyCancellable {
    return BrownfieldStateInternal.shared.subscribe(key) { value in
      guard let typed = value as? T else { return }
      callback(typed)
    }
  }

  @discardableResult
  public static func delete(_ key: String) -> Any? {
    return BrownfieldStateInternal.shared.delete(key)
  }
}
