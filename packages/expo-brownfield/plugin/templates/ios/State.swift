internal import ExpoBrownfield

public struct BrownfieldState {
  public static func get(_ key: String) -> Any? {
    return BrownfieldStateInternal.get(key)
  }

  public static func set(_ key: String, _ value: Any?) {
    BrownfieldStateInternal.set(key, value)
  }

  @discardableResult
  public static func subscribe(
    _ key: String, 
    _ callback: @escaping (Any?) -> Void
  ) -> Removable {
    return BrownfieldStateInternal.subscribe(key, callback)
  }

  public static func delete(_ key: String) -> Any? {
    return BrownfieldStateInternal.delete(key)
  }
}