/**
 The definition of the view manager. It's part of the module definition to scope only view-related definitions.
 */
public class ViewManagerDefinition: ObjectDefinition {
  /**
   The view factory that lets us create views.
   */
  let factory: ViewFactory?

  /**
   An array of view props definitions.
   */
  let props: [AnyViewProp]

  /**
   Names of the events that the view can send to JavaScript.
   */
  let eventNames: [String]

  /**
   An array of the view lifecycle methods.
   */
  let lifecycleMethods: [AnyViewLifecycleMethod]

  /**
   Default initializer receiving children definitions from the result builder.
   */
  override init(definitions: [AnyDefinition]) {
    self.factory = definitions
      .compactMap { $0 as? ViewFactory }
      .last

    self.props = definitions
      .compactMap { $0 as? AnyViewProp }

    self.eventNames = Array(
      definitions
        .compactMap { ($0 as? EventsDefinition)?.names }
        .joined()
    )

    self.lifecycleMethods = definitions
      .compactMap { $0 as? AnyViewLifecycleMethod }

    super.init(definitions: definitions)
  }

  /**
   Creates a new view using the view factory. Returns `nil` if the definition doesn't use the `view` function.
   */
  func createView(appContext: AppContext) -> UIView? {
    return factory?.create()
  }

  /**
   Returns props definitions as a dictionary where the keys are the prop names.
   */
  func propsDict() -> [String: AnyViewProp] {
    return props.reduce(into: [String: AnyViewProp]()) { acc, prop in
      acc[prop.name] = prop
    }
  }

  /**
   Calls defined lifecycle methods with the given type.
   */
  func callLifecycleMethods(withType type: ViewLifecycleMethodType, forView view: UIView) {
    for method in lifecycleMethods where method.type == type {
      method(view)
    }
  }
}

/**
 The protocol for definition components that can only be handled by the view manager builder.
 */
public protocol ViewManagerDefinitionComponent: AnyDefinition {}
