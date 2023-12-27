import UIKit

/**
 Type-erased protocol for view props classes.
 */
public protocol AnyViewProp: AnyDefinition {
  /**
   Name of the prop.
   */
  var name: String { get }

  /**
   Function that sets the underlying prop value for given view.
   */
  func set(value: Any?, onView: UIView)
}
