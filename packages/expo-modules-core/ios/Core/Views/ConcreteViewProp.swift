// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Specialized class for the view prop. Specifies the prop name and its setter.
 */
public final class ConcreteViewProp<ViewType: UIView, PropType: AnyArgument>: AnyViewProp {
  public typealias SetterType = (ViewType, PropType) -> Void

  /**
   Name of the view prop that JavaScript refers to.
   */
  public let name: String

  /**
   A dynamic type for the prop's value type.
   */
  private let propType: AnyDynamicType

  /**
   Closure to call to set the actual property on the given view.
   */
  private let setter: SetterType

  internal init(name: String, propType: AnyDynamicType, setter: @escaping SetterType) {
    self.name = name
    self.propType = propType
    self.setter = setter
  }

  /**
   Function that sets the underlying prop value for given view.
   */
  public func set(value: Any, onView view: UIView, appContext: AppContext) throws {
    // Method's signature must be type-erased to conform to `AnyViewProp` protocol.
    // Given view must be castable to the generic `ViewType` type.
    guard let view = view as? ViewType else {
      throw IncompatibleViewException((propName: name, viewType: ViewType.self))
    }
    guard let value = try propType.cast(value, appContext: appContext) as? PropType else {
      throw Conversions.CastingException<PropType>(value)
    }
    setter(view, value)
  }
}

/**
 An exception that is thrown when the view passed to prop's setter doesn't match the type in setter's definition.
 */
internal class IncompatibleViewException: GenericException<(propName: String, viewType: UIView.Type)> {
  override var reason: String {
    "Tried to set prop '\(param.propName)' on the view that isn't \(param.viewType)"
  }
}
