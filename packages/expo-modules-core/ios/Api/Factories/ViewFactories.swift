/// Here we implement factories for the definitions exclusive for native views.

// Function names should start with a lowercase character, but in this one case
// we want it to be uppercase for Expo Modules DSL
// swiftlint:disable identifier_name

/**
 Creates a view definition describing the native view exported to React.
 */
public func View<ViewType: UIView>(
  _ viewType: ViewType.Type,
  @ViewDefinitionBuilder<ViewType> _ elements: @escaping () -> [AnyViewDefinitionElement]
) -> ViewDefinition<ViewType> {
  return ViewDefinition(viewType, elements: elements())
}

/**
 Creates a view definition describing the native SwiftUI view exported to React.
 */
public func View<Props: ExpoSwiftUI.ViewProps, ViewType: ExpoSwiftUI.View>(
  _ viewType: ViewType.Type
) -> ExpoSwiftUI.ViewDefinition<Props, ViewType> {
  return ExpoSwiftUI.ViewDefinition(ViewType.self)
}

public func View<Props: ExpoSwiftUI.ViewProps, ViewType: ExpoSwiftUI.View>(
  _ viewType: ViewType.Type,
  @ExpoSwiftUI.ViewDefinitionBuilder<ViewType> _ elements: @escaping () -> [AnyViewDefinitionElement]
) -> ExpoSwiftUI.ViewDefinition<Props, ViewType> {
  return ExpoSwiftUI.ViewDefinition(ViewType.self, elements: elements())
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

/**
 Sets the name of the view that is exported to the JavaScript world.
 */
public func ViewName(_ name: String) -> ViewNameDefinition {
  return ViewNameDefinition(name: name)
}

// swiftlint:enable identifier_name
