// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A definition representing the native view to export to React.
 */
public class ViewDefinition<ViewType>: ObjectDefinition, AnyViewDefinition, @unchecked Sendable {
  public override var _definitionClassification: DefinitionClassification {
    return DefinitionClassification(kind: .view(self))
  }

  /**
   An array of view props definitions.
   */
  public let props: [any AnyViewProp]

  /**
   Name of the defined view. Falls back to the type name if not provided in the definition.
   */
  public var name: String

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
    var props = [any AnyViewProp]()
    var name: String?
    var eventNames = [String]()
    var lifecycleMethods = [AnyViewLifecycleMethod]()

    for element in elements {
      switch element._definitionClassification.kind {
      case .viewProp(let prop):
        props.append(prop)
      case .viewName(let nameDefinition):
        name = nameDefinition.name
      case .events(let events):
        eventNames.append(contentsOf: events.names)
      case .viewLifecycle(let method):
        lifecycleMethods.append(method)
      case .unknown:
        // `AnyViewProp` is the only element protocol collected here that a type from another module can conform to.
        if let prop = element as? AnyViewProp {
          props.append(prop)
        }
      case .function, .staticFunction, .legacyConstants, .constant, .property, .klass, .moduleName, .eventListener, .eventObserver, .view:
        break
      }
    }

    self.props = props
    self.name = name ?? unqualifiedTypeName(viewType)
    self.eventNames = eventNames
    self.lifecycleMethods = lifecycleMethods

    super.init(definitions: elements)
  }

  // MARK: - AnyViewDefinition

  public func createView(appContext: AppContext) -> AppleView? {
    // It's assumed that this function is called only from the main thread.
    // In the ideal scenario it would be marked as `@MainActor`, but then `ViewModuleWrapper`
    // would be incompatible with `RCTViewManager` as it doesn't specify the actor.
    return MainActor.assumeIsolated {
      if let expoViewType = ViewType.self as? AnyExpoView.Type {
        if let fabricViewType = ViewType.self as? ExpoFabricView.Type {
          return AppleView.from(ExpoFabricView.create(viewType: fabricViewType, viewDefinition: self, appContext: appContext))
        }
        return AppleView.from(expoViewType.init(appContext: appContext))
      }
      if let UIViewType = ViewType.self as? UIView.Type {
        return AppleView.from(UIViewType.init(frame: .zero))
      }
      return nil
    }
  }

  public func propsDict() -> [String: AnyViewProp] {
    return props.reduce(into: [String: AnyViewProp]()) { acc, prop in
      acc[prop.name] = prop
    }
  }

  public func getSupportedPropNames() -> [String] {
    return props.map(\.name)
  }

  public func getSupportedEventNames() -> [String] {
    return eventNames
  }

  @MainActor
  public func callLifecycleMethods(withType type: ViewLifecycleMethodType, forView view: AppleView) {
    for method in lifecycleMethods where method.type == type {
      method(view)
    }
  }

  @JavaScriptActor
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

extension UIView: @MainActor AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicViewType(innerType: Self.self)
  }
}

public struct ViewNameDefinition: AnyViewDefinitionElement {
  public var _definitionClassification: DefinitionClassification {
    return DefinitionClassification(kind: .viewName(self))
  }

  let name: String
}
