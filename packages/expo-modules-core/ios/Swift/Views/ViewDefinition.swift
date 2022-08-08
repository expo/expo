// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A component representing the native view to export to React.

 Temporarily it extends the old `ViewManagerDefinition`, but the plan is to replace it entirely.
 The difference is that the old one allows the user to initialize the view (and pass some custom arguments).
 To integrate well with Fabric and its recycling mechanism, we have to disallow that and so call the view initializer internally.
 As a consequence, the user should just provide the type of the view.
 */
public final class ViewDefinition: ViewManagerDefinition {
  init<ViewType>(_ viewType: ViewType.Type, elements: [AnyDefinition]) where ViewType: UIView {
    let factory = ViewFactory({ ViewType() })
    super.init(definitions: elements + [factory])
  }
}

/**
 A result builder for the view elements such as prop setters or view events.
 */
@resultBuilder
public struct ViewDefinitionElementsBuilder {
  // TODO: Restrict the element types to only these that are handled by the ViewComponent
  public static func buildBlock(_ elements: AnyDefinition...) -> [AnyDefinition] {
    return elements
  }
}

/**
 Creates a view definition describing the native view exported to React.
 */
public func View<ViewType: UIView>(
  _ viewType: ViewType.Type,
  @ViewDefinitionElementsBuilder _ elements: @escaping () -> [AnyDefinition]
) -> ViewDefinition {
  return ViewDefinition(viewType, elements: elements())
}
