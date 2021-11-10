// Copyright 2021-present 650 Industries. All rights reserved.

import UIKit

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
   An argument type wrapper for the prop's value type.
   */
  private let propType: AnyArgumentType

  /**
   Closure to call to set the actual property on the given view.
   */
  private let setter: SetterType

  internal init(name: String, propType: AnyArgumentType, setter: @escaping SetterType) {
    self.name = name
    self.propType = propType
    self.setter = setter
  }

  /**
   Function that sets the underlying prop value for given view.
   */
  public func set(value: Any, onView view: UIView) throws {
    // Method's signature must be type-erased to conform to `AnyViewProp` protocol.
    // Given view must be castable to the generic `ViewType` type.
    guard let view = view as? ViewType else {
      throw IncompatibleViewError(propName: name, viewType: ViewType.self)
    }
    guard let value = try propType.cast(value) as? PropType else {
      throw Conversions.CastingError<PropType>(value: value)
    }
    setter(view, value)
  }
}

/**
 An error that is thrown when the view passed to prop's setter doesn't match the type in setter's definition.
 */
internal struct IncompatibleViewError: CodedError {
  let propName: String
  let viewType: UIView.Type
  var description: String {
    "Tried to set prop `\(propName)` on the view that isn't `\(viewType)`"
  }
}
