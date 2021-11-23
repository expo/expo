import UIKit

/**
 Extends all modules with the functions used to build a module definition.
 Unfortunately they need to be scoped here, but hopefully this proposal
 https://github.com/apple/swift-evolution/blob/main/proposals/0289-result-builders.md#builder-scoped-name-lookup
 will be implemented in the future.
 */
extension AnyModule {
  // MARK: - Module name

  /**
   Sets the name of the module that is exported to the JavaScript world.
   */
  public func name(_ name: String) -> AnyDefinition {
    return ModuleNameDefinition(name: name)
  }

  // MARK: - Constants

  /**
   Definition function setting the module's constants to export.
   */
  public func constants(_ body: @escaping () -> [String: Any?]) -> AnyDefinition {
    return ConstantsDefinition(body: body)
  }

  /**
   Definition function setting the module's constants to export.
   */
  public func constants(_ body: @autoclosure @escaping () -> [String: Any?]) -> AnyDefinition {
    return ConstantsDefinition(body: body)
  }

  // MARK: - Functions

  /**
   Function without arguments.
   */
  public func function<R>(
    _ name: String,
    _ closure: @escaping () -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [],
      closure
    )
  }

  /**
   Function with one argument.
   */
  public func function<R, A0: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self)],
      closure
    )
  }

  /**
   Function with two arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self)],
      closure
    )
  }

  /**
   Function with three arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self)],
      closure
    )
  }

  /**
   Function with four arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self)],
      closure
    )
  }

  /**
   Function with five arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self)],
      closure
    )
  }

  /**
   Function with six arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4, A5) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self), ArgumentType(A5.self)],
      closure
    )
  }

  /**
   Function with seven arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self), ArgumentType(A5.self), ArgumentType(A6.self)],
      closure
    )
  }

  /**
   Function with eight arguments.
   */
  public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self), ArgumentType(A5.self), ArgumentType(A6.self), ArgumentType(A7.self)],
      closure
    )
  }

  // MARK: - Module's lifecycle

  /**
   Creates module's lifecycle listener that is called right after module initialization.
   */
  public func onCreate(_ closure: @escaping () -> Void) -> AnyDefinition {
    return EventListener(.moduleCreate, closure)
  }

  /**
   Creates module's lifecycle listener that is called when the module is about to be deallocated.
   */
  public func onDestroy(_ closure: @escaping () -> Void) -> AnyDefinition {
    return EventListener(.moduleDestroy, closure)
  }

  /**
   Creates module's lifecycle listener that is called when the app context owning the module is about to be deallocated.
   */
  public func onAppContextDestroys(_ closure: @escaping () -> Void) -> AnyDefinition {
    return EventListener(.appContextDestroys, closure)
  }

  /**
   Creates a listener that is called when the app is about to enter the foreground mode.
   */
  public func onAppEntersForeground(_ closure: @escaping () -> Void) -> AnyDefinition {
    return EventListener(.appEntersForeground, closure)
  }

  /**
   Creates a listener that is called when the app becomes active again.
   */
  public func onAppBecomesActive(_ closure: @escaping () -> Void) -> AnyDefinition {
    return EventListener(.appBecomesActive, closure)
  }

  /**
   Creates a listener that is called when the app enters the background mode.
   */
  public func onAppEntersBackground(_ closure: @escaping () -> Void) -> AnyDefinition {
    return EventListener(.appEntersBackground, closure)
  }

  // MARK: - View Manager

  /**
   Creates the view manager definition that scopes other view-related definitions.
   */
  public func viewManager(@ViewManagerDefinitionBuilder _ closure: @escaping () -> ViewManagerDefinition) -> AnyDefinition {
    return closure()
  }

  // MARK: - Events

  /**
   Defines event names that this module can send to JavaScript.
   */
  public func events(_ names: String...) -> AnyDefinition {
    return EventsDefinition(names: names)
  }

  /**
   Function that is invoked when the first event listener is added.
   */
  public func onStartObserving(_ body: @escaping () -> ()) -> AnyFunction {
    return ConcreteFunction("startObserving", argTypes: [], body)
  }

  /**
   Function that is invoked when all event listeners are removed.
   */
  public func onStopObserving(_ body: @escaping () -> ()) -> AnyFunction {
    return ConcreteFunction("stopObserving", argTypes: [], body)
  }
}

/**
 Defines the factory creating a native view when the module is used as a view.
 */
public func view(_ closure: @escaping () -> UIView) -> AnyDefinition {
  return ViewFactory(closure)
}

/**
 Creates a view prop that defines its name and setter.
 */
public func prop<ViewType: UIView, PropType: AnyArgument>(
  _ name: String,
  _ setter: @escaping (ViewType, PropType) -> Void
) -> AnyDefinition {
  return ConcreteViewProp(
    name: name,
    propType: ArgumentType(PropType.self),
    setter: setter
  )
}

// TODO: - Remove deprecated `method` component once SDK44 is out.
public extension AnyModule {
  /**
   Function without arguments.
   */
  @available(*, deprecated, renamed: "function")
  func method<R>(
    _ name: String,
    _ closure: @escaping () -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [],
      closure
    )
  }

  /**
   Function with one argument.
   */
  @available(*, deprecated, renamed: "function")
  func method<R, A0: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self)],
      closure
    )
  }

  /**
   Function with two arguments.
   */
  @available(*, deprecated, renamed: "function")
  func method<R, A0: AnyArgument, A1: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1) -> R
  ) -> AnyFunction {
    return ConcreteFunction(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self)],
      closure
    )
  }
}
