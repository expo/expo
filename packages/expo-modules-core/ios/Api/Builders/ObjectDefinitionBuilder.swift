// Copyright 2022-present 650 Industries. All rights reserved.

public protocol AnyObjectDefinitionElement: AnyDefinition {}

@resultBuilder
public struct ObjectDefinitionBuilder {
  public static func buildBlock(_ elements: AnyObjectDefinitionElement...) -> [AnyObjectDefinitionElement] {
    return elements
  }

  /**
   Default implementation without any constraints that just returns type-erased element.
   */
  public static func buildExpression<ElementType: AnyObjectDefinitionElement>(_ element: ElementType) -> AnyObjectDefinitionElement {
    return element
  }
}

extension SyncFunctionDefinition: AnyObjectDefinitionElement {}

extension AsyncFunctionDefinition: AnyObjectDefinitionElement {}

extension PropertyDefinition: AnyObjectDefinitionElement {}

extension ConstantsDefinition: AnyObjectDefinitionElement {}
