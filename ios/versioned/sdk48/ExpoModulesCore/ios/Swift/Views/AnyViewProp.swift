import UIKit

/**
 Type-erased protocol for view props classes.
 */
public protocol AnyViewProp: ViewManagerDefinitionComponent {
  /**
   Name of the view prop that JavaScript refers to.
   */
  var name: String { get }

  /**
   Function that sets the underlying prop value for given view.
   */
  func set(value: Any, onView: UIView) throws
}
