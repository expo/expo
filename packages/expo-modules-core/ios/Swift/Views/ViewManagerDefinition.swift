import UIKit

/**
 The definition of the view manager. It's part of the module definition to scope only view-related definitions.
 */
public final class ViewManagerDefinition: ObjectDefinition {
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

    super.init(definitions: definitions)
  }

  /**
   Creates a new view using the view factory. Returns `nil` if the definition doesn't use the `view` function.
   */
  func createView() -> UIView? {
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
}

/**
 The protocol for definition components that can only be handled by the view manager builder.
 */
public protocol ViewManagerDefinitionComponent: AnyDefinition {}
