
struct AnyArgumentType: CustomDebugStringConvertible {
  let baseType: Any.Type

  private let castHelper: (Any) -> AnyMethodArgument?
  private let canCastHelper: (Any) -> Bool

  init<T: AnyMethodArgument>(_ baseType: T.Type) {
    self.baseType = baseType

    self.castHelper = { $0 as? T }

    // handle class metatypes separately in order to allow T.self != base.
    if baseType is AnyClass {
      self.canCastHelper = { x in
        sequence(
          first: Mirror(reflecting: x), next: { $0.superclassMirror }
        )
        .contains { $0.subjectType == baseType }
      }
    } else {
      self.canCastHelper = { $0 is T.Type }
    }
  }

  func cast<T>(_ object: T) -> AnyMethodArgument? {
    return castHelper(object)
  }

  func canCast<T>(_ object: T) -> Bool {
    return canCastHelper(object)
  }

  func castWrappedType<T>(_ type: T.Type) -> T? {
    return baseType as? T
  }

  // MARK: CustomDebugStringConvertible

  var debugDescription: String {
    return String(describing: baseType)
  }
}
