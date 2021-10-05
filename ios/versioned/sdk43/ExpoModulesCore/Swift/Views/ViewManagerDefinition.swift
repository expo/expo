import UIKit

/**
 The definition of the view manager. It's part of the module definition to scope only view-related definitions.
 */
public struct ViewManagerDefinition: AnyDefinition {
  /**
   The view factory that lets us create views.
   */
  let factory: ViewFactory?

  /**
   An array of view props definitions.
   */
  let props: [AnyViewProp]

  init(definitions: [AnyDefinition]) {
    self.factory = definitions
      .compactMap { $0 as? ViewFactory }
      .last

    self.props = definitions
      .compactMap { $0 as? AnyViewProp }
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
