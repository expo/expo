/// Here we implement the components exclusive for view managers.

// MARK: View factory

/**
 Defines the factory creating a native view when the module is used as a view.
 */
public func view(_ closure: @escaping () -> UIView) -> ViewManagerDefinitionComponent {
  return ViewFactory(closure)
}

// MARK: Props

/**
 Creates a view prop that defines its name and setter.
 */
public func prop<ViewType: UIView, PropType: AnyArgument>(
  _ name: String,
  _ setter: @escaping (ViewType, PropType) -> Void
) -> ViewManagerDefinitionComponent {
  return ConcreteViewProp(
    name: name,
    propType: ArgumentType(PropType.self),
    setter: setter
  )
}
