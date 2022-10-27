// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A result builder that captures the ``ClassComponent`` elements such as functions, constants and properties.
 */
@resultBuilder
public struct ClassComponentElementsBuilder<OwnerType> {
  public static func buildBlock(_ elements: AnyClassComponentElement...) -> [AnyClassComponentElement] {
    return elements
  }

  /**
   Default implementation without any constraints that just returns type-erased element.
   */
  public static func buildExpression<ElementType: ClassComponentElement>(
    _ element: ElementType
  ) -> AnyClassComponentElement {
    return element
  }

  /**
   In case the element's owner type matches builder's generic type,
   we need to instruct the function to pass `this` to the closure
   as the first argument and deduct it from `argumentsCount`.
   */
  public static func buildExpression<ElementType: ClassComponentElement>(
    _ element: ElementType
  ) -> AnyClassComponentElement where ElementType.OwnerType == OwnerType {
    if var function = element as? AnyFunction {
      function.takesOwner = true
    }
    return element
  }
}
