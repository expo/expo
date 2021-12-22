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
   Name of the defined view manager. Falls back to the module name if not provided in the definition.
   */
  let name: String

  /**
   Default initializer receiving children definitions from the result builder.
   */
  override init(definitions: [AnyDefinition]) {
    self.factory = definitions
      .compactMap { $0 as? ViewFactory }
      .last

    self.props = definitions
      .compactMap { $0 as? AnyViewProp }
    
    // TODO: Throw upon multiple view managers definitions with the same name
    self.name = definitions
      .compactMap { $0 as? ViewManageerNameDefinition }
      .last?
      .name ?? ""

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
 View manager's name definition. Returned by `name()` in view manager's definition.
 */
internal struct ViewManageerNameDefinition: AnyDefinition {
  let name: String
}
