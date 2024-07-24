/// Here we implement factories for the definitions exclusive for native views.

/**
 Creates a view definition describing the native view exported to React.
 */
public func View<ViewType: UIView>(
  _ viewType: ViewType.Type,
  @ViewDefinitionBuilder<ViewType> _ elements: @escaping () -> [AnyViewDefinitionElement]
) -> ViewDefinition<ViewType> {
  return ViewDefinition(viewType, elements: elements())
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

// MARK: - View lifecycle

/**
 Defines the view lifecycle method that is called when the view finished updating all props.
 */
public func OnViewDidUpdateProps<ViewType: UIView>(
  @_implicitSelfCapture _ closure: @escaping (_ view: ViewType) -> Void
) -> ViewLifecycleMethod<ViewType> {
  return ViewLifecycleMethod(type: .didUpdateProps, closure: closure)
}
