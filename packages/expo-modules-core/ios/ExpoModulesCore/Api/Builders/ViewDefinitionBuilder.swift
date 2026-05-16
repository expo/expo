/**
 A result builder for the view elements such as prop setters or view events.
 */
@resultBuilder
public struct ViewDefinitionBuilder<ViewType: UIView> {
  public static func buildBlock(_ elements: AnyViewDefinitionElement...) -> [AnyViewDefinitionElement] {
    return elements
  }

  /**
   Accepts `Events` definition element of `View`.
   */
  public static func buildExpression(_ element: EventsDefinition) -> AnyViewDefinitionElement {
    return element
  }

  /**
   Accepts `ViewName` definition element of `View`.
   */
  public static func buildExpression(_ element: ViewNameDefinition) -> AnyViewDefinitionElement {
    return element
  }

  /**
   Accepts `Prop` definition element and lets to skip defining the view type — it's inferred from the `View` definition.
   */
  public static func buildExpression<PropType: AnyArgument>(_ element: ConcreteViewProp<ViewType, PropType>) -> AnyViewDefinitionElement {
    return element
  }

  /**
   Accepts lifecycle methods (such as `OnViewDidUpdateProps`) as a definition element.
   */
  public static func buildExpression(_ element: ViewLifecycleMethod<ViewType>) -> AnyViewDefinitionElement {
    return element
  }

  /**
   Accepts functions as a view definition elements.
   */
  public static func buildExpression<ElementType: ViewDefinitionFunctionElement>(
    _ element: ElementType
  ) -> AnyViewDefinitionElement {
    return element
  }

  /**
   Accepts functions that take the owner as a view definition elements.
   */
  public static func buildExpression<ElementType: ViewDefinitionFunctionElement>(
    _ element: ElementType
  ) -> AnyViewDefinitionElement where ElementType.ViewType == ViewType {
    // Enforce async functions to run on the main queue
    if var function = element as? AnyAsyncFunctionDefinition {
      function.runOnQueue(.main)
      function.takesOwner = true
    }

    if var function = element as? AnyConcurrentFunctionDefinition {
      function.requiresMainActor = true
      function.takesOwner = true
    }
    return element
  }
}
