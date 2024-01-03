// MARK: - Module name

/**
 Sets the name of the module that is exported to the JavaScript world.
 */
public func Name(_ name: String) -> AnyDefinition {
  return ModuleNameDefinition(name: name)
}

// MARK: - Module's lifecycle

/**
 Creates module's lifecycle listener that is called right after module initialization.
 */
public func OnCreate(@_implicitSelfCapture _ closure: @escaping () -> Void) -> AnyDefinition {
  return EventListener(.moduleCreate, closure)
}

/**
 Creates module's lifecycle listener that is called when the module is about to be deallocated.
 */
public func OnDestroy(@_implicitSelfCapture _ closure: @escaping () -> Void) -> AnyDefinition {
  return EventListener(.moduleDestroy, closure)
}

/**
 Creates module's lifecycle listener that is called when the app context owning the module is about to be deallocated.
 */
public func OnAppContextDestroys(@_implicitSelfCapture _ closure: @escaping () -> Void) -> AnyDefinition {
  return EventListener(.appContextDestroys, closure)
}

/**
 Creates a listener that is called when the app is about to enter the foreground mode.
 */
public func OnAppEntersForeground(@_implicitSelfCapture _ closure: @escaping () -> Void) -> AnyDefinition {
  return EventListener(.appEntersForeground, closure)
}

/**
 Creates a listener that is called when the app becomes active again.
 */
public func OnAppBecomesActive(@_implicitSelfCapture _ closure: @escaping () -> Void) -> AnyDefinition {
  return EventListener(.appBecomesActive, closure)
}

/**
 Creates a listener that is called when the app enters the background mode.
 */
public func OnAppEntersBackground(@_implicitSelfCapture _ closure: @escaping () -> Void) -> AnyDefinition {
  return EventListener(.appEntersBackground, closure)
}

// MARK: - View Manager

/**
 Creates the view manager definition that scopes other view-related definitions.
 */
public func ViewManager(@ViewManagerDefinitionBuilder _ closure: @escaping () -> ViewManagerDefinition) -> AnyDefinition {
  return closure()
}
