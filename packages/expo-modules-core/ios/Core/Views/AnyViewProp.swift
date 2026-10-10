/**
 Type-erased protocol for view props classes.
 */
public protocol AnyViewProp: AnyViewDefinitionElement {
  /**
   Name of the view prop that JavaScript refers to.
   */
  var name: String { get }

  /**
   Function that sets the underlying prop value for given view.
   */
  func set(value: Any, onView: UIView, appContext: AppContext) throws
}

extension AnyViewProp {
  /**
   Default collection for view props declared outside of this module. Mirrors the `as? AnyViewProp` cast that
   `ViewDefinition` used to perform, so external conformers keep being registered as props.
   */
  public func __collect(into buckets: inout DefinitionBuckets) {
    buckets.viewProps.append(self)
  }
}
