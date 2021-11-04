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
  public func constants(_ closure: () -> [String : Any?]) -> AnyDefinition {
    return ConstantsDefinition(constants: closure())
  }

  // MARK: - Methods

  /**
   Factory function for methods without arguments.
   */
  public func method<R>(
    _ name: String,
    _ closure: @escaping () -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [],
      closure
    )
  }

  /**
   Factory function for methods with one argument.
   */
  public func method<R, A0: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self)],
      closure
    )
  }

  /**
   Factory function for methods with 2 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self)],
      closure
    )
  }

  /**
   Factory function for methods with 3 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self)],
      closure
    )
  }

  /**
   Factory function for methods with 4 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self)],
      closure
    )
  }

  /**
   Factory function for methods with 5 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self)],
      closure
    )
  }

  /**
   Factory function for methods with 6 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4, A5) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self), ArgumentType(A5.self)],
      closure
    )
  }

  /**
   Factory function for methods with 7 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
      name,
      argTypes: [ArgumentType(A0.self), ArgumentType(A1.self), ArgumentType(A2.self), ArgumentType(A3.self), ArgumentType(A4.self), ArgumentType(A5.self), ArgumentType(A6.self)],
      closure
    )
  }

  /**
   Factory function for methods with 8 arguments.
   */
  public func method<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
    _ name: String,
    _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) -> R
  ) -> AnyMethod {
    return ConcreteMethod(
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
   Method that is invoked when the first event listener is added.
   */
  public func onStartObserving(_ body: @escaping () -> ()) -> AnyMethod {
    return ConcreteMethod("startObserving", argTypes: [], body)
  }

  /**
   Method that is invoked when all event listeners are removed.
   */
  public func onStopObserving(_ body: @escaping () -> ()) -> AnyMethod {
    return ConcreteMethod("stopObserving", argTypes: [], body)
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
public func prop<ViewType: UIView, PropType>(_ name: String, _ setter: @escaping (ViewType, PropType) -> Void) -> AnyDefinition {
  return ConcreteViewProp(name, setter)
}
