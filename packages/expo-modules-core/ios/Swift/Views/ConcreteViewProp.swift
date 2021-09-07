import UIKit

/**
 Specialized class for the view prop. Specifies the prop name and its setter.
 */
public class ConcreteViewProp<ViewType: UIView, PropType>: AnyViewProp {
  public typealias SetterType = (ViewType, PropType) -> Void

  public let name: String

  let setter: SetterType

  init(_ name: String, _ setter: @escaping SetterType) {
    self.name = name
    self.setter = setter
  }

  public func set(value: Any?, onView view: UIView) {
    // Method's signature must be type-erased for `AnyViewProp` protocol,
    // so we have to get UIView and cast it to the generic type.
    // TODO: (@tsapeta) Throw an error instead of crashing the app.
    guard let view = view as? ViewType else {
      fatalError("Given view must subclass UIView")
    }
    guard let value = value as? PropType else {
      fatalError("Given value `\(String(describing: value))` cannot be casted to `\(String(describing: PropType.self))`")
    }
    setter(view, value)
  }
}
