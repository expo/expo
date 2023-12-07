// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A component representing the native view to export to React.

 Temporarily it extends the old `ViewManagerDefinition`, but the plan is to replace it entirely.
 The difference is that the old one allows the user to initialize the view (and pass some custom arguments).
 To integrate well with Fabric and its recycling mechanism, we have to disallow that and so call the view initializer internally.
 As a consequence, the user should just provide the type of the view.
 */
public final class ViewDefinition<ViewType: UIView>: ViewManagerDefinition {
  init(_ viewType: ViewType.Type, elements: [AnyDefinition]) {
    super.init(definitions: elements)
  }

  override func createView(appContext: AppContext) -> UIView? {
    if let expoViewType = ViewType.self as? ExpoView.Type {
      return expoViewType.init(appContext: appContext)
    }
    if let legacyViewType = ViewType.self as? EXLegacyExpoViewProtocol.Type {
      return legacyViewType.init(moduleRegistry: appContext.legacyModuleRegistry) as? UIView
    }
    return ViewType(frame: .zero)
  }

  /**
   A result builder for the view elements such as prop setters or view events.
   */
  @resultBuilder
  public struct ElementsBuilder {
    public static func buildBlock(_ elements: AnyViewDefinitionElement...) -> [AnyDefinition] {
      return elements
    }

    /**
     Accepts `Events` component as a definition element of `View`.
     */
    public static func buildExpression(_ element: EventsDefinition) -> AnyViewDefinitionElement {
      return element
    }

    /**
     Accepts `Prop` component as a definition element and lets to skip defining the view type — it's inferred from the `View` component.
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
      if var function = element as? AnyAsyncFunctionComponent {
        function.runOnQueue(.main)
        function.takesOwner = true
      }
      return element
    }
  }
}

// MARK: - AnyViewDefinitionElement

public protocol AnyViewDefinitionElement: AnyDefinition {}
extension ConcreteViewProp: AnyViewDefinitionElement {}
extension EventsDefinition: AnyViewDefinitionElement {}
extension ViewLifecycleMethod: AnyViewDefinitionElement {}

// MARK: - ViewDefinitionFunctionElement

public protocol ViewDefinitionFunctionElement: AnyViewDefinitionElement {
  associatedtype ViewType
}
extension AsyncFunctionComponent: ViewDefinitionFunctionElement {
  public typealias ViewType = FirstArgType
}
extension ConcurrentFunctionDefinition: ViewDefinitionFunctionElement {
  public typealias ViewType = FirstArgType
}

extension UIView: AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicViewType(innerType: Self.self)
  }
}

/**
 Creates a view definition describing the native view exported to React.
 */
public func View<ViewType: UIView>(
  _ viewType: ViewType.Type,
  @ViewDefinition<ViewType>.ElementsBuilder _ elements: @escaping () -> [AnyDefinition]
) -> ViewDefinition<ViewType> {
  return ViewDefinition(viewType, elements: elements())
}
