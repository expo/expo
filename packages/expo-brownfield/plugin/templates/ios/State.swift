internal import ExpoBrownfield

public protocol StateRemovable {
  func remove()
}

private final class RemovableWrapper: StateRemovable {
  private let wrapped: any ExpoBrownfield.Removable
  
  init(_ removable: any ExpoBrownfield.Removable) {
    self.wrapped = removable
  }
  
  public func remove() {
    wrapped.remove()
  }
}

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
  ) -> StateRemovable {
    return RemovableWrapper(BrownfieldStateInternal.subscribe(key, callback))
  }

  public static func delete(_ key: String) -> Any? {
    return BrownfieldStateInternal.delete(key)
  }
}