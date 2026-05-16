// Copyright 2025-present 650 Industries. All rights reserved.

extension ExpoSwiftUI {
  /**
   A result builder for the view elements such as prop setters or view events.
   */
  @resultBuilder
  public struct ViewDefinitionBuilder<ViewType: ExpoSwiftUI.View> {
    public static func buildBlock(_ elements: AnyViewDefinitionElement...) -> [AnyViewDefinitionElement] {
      return elements
    }

    /**
     Accepts `ViewName` definition element of `View`.
     */
    public static func buildExpression(_ element: ViewNameDefinition) -> AnyViewDefinitionElement {
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
}
