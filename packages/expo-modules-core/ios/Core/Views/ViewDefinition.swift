// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A definition representing the native view to export to React.
 */
public class ViewDefinition<ViewType: UIView>: ObjectDefinition, AnyViewDefinition {
  /**
   An array of view props definitions.
   */
  public let props: [AnyViewProp]

  /**
   Names of the events that the view can send to JavaScript.
   */
  public let eventNames: [String]

  /**
   An array of the view lifecycle methods.
   */
  let lifecycleMethods: [AnyViewLifecycleMethod]

  /**
   Default initializer receiving children definitions from the result builder.
   */
  init(_ viewType: ViewType.Type, elements: [AnyViewDefinitionElement]) {
    self.props = elements
      .compactMap { $0 as? AnyViewProp }

    self.eventNames = Array(
      elements
        .compactMap { ($0 as? EventsDefinition)?.names }
        .joined()
    )

    self.lifecycleMethods = elements
      .compactMap { $0 as? AnyViewLifecycleMethod }

    super.init(definitions: elements)
  }

  // MARK: - AnyViewDefinition

  public func createView(appContext: AppContext) -> UIView? {
    if let expoViewType = ViewType.self as? AnyExpoView.Type {
#if RCT_NEW_ARCH_ENABLED
      if let fabricViewType = ViewType.self as? ExpoFabricView.Type {
        return ExpoFabricView.create(viewType: fabricViewType, viewDefinition: self, appContext: appContext)
      }
#endif
      return expoViewType.init(appContext: appContext)
    }
    if let legacyViewType = ViewType.self as? EXLegacyExpoViewProtocol.Type {
      return legacyViewType.init(moduleRegistry: appContext.legacyModuleRegistry) as? UIView
    }
    return ViewType(frame: .zero)
  }

  public func propsDict() -> [String: AnyViewProp] {
    return props.reduce(into: [String: AnyViewProp]()) { acc, prop in
      acc[prop.name] = prop
    }
  }

  public func getSupportedPropNames() -> [String] {
    return props.map(\.name)
  }

  public func callLifecycleMethods(withType type: ViewLifecycleMethodType, forView view: UIView) {
    for method in lifecycleMethods where method.type == type {
      method(view)
    }
  }

  public func createReactComponentPrototype(appContext: AppContext) throws -> JavaScriptObject {
    let prototype = try appContext.runtime.createObject()

    try decorateWithFunctions(object: prototype, appContext: appContext)

    return prototype
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
extension AsyncFunctionDefinition: ViewDefinitionFunctionElement {
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
