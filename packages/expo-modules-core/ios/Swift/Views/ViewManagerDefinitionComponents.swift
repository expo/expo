/// Here we implement the components exclusive for view managers.

// MARK: View factory

/**
 Defines the factory creating a native view when the module is used as a view.
 */
public func View<ViewType: UIView>(_ closure: @escaping () -> ViewType) -> ViewManagerDefinitionComponent {
  return ViewFactory(closure)
}

// MARK: Props

/**
 Creates a view prop that defines its name and setter.
 */
public func Prop<ViewType: UIView, PropType: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ setter: @escaping (ViewType, PropType) -> Void
) -> ConcreteViewProp<ViewType, PropType> {
  return ConcreteViewProp(
    name: name,
    propType: ~PropType.self,
    setter: setter
  )
}
