// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A result builder that captures the ``ClassDefinition`` elements such as functions, constants and properties.
 */
@resultBuilder
public struct ClassDefinitionBuilder<OwnerType> {
  public static func buildBlock(_ elements: AnyClassDefinitionElement...) -> [AnyClassDefinitionElement] {
    return elements
  }

  /**
   Default implementation without any constraints that just returns type-erased element.
   */
  public static func buildExpression<ElementType: AnyClassDefinitionElement>(
    _ element: ElementType
  ) -> AnyClassDefinitionElement {
    return element
  }

  /**
   In case the element's owner type matches builder's generic type,
   we need to instruct the function to pass `this` to the closure
   as the first argument and deduct it from `argumentsCount`.
   */
  public static func buildExpression<ElementType: ClassDefinitionElement>(
    _ element: ElementType
  ) -> AnyClassDefinitionElement where ElementType.OwnerType == OwnerType {
    if var function = element as? AnyFunctionDefinition {
      function.takesOwner = true
    }
    return element
  }
}
