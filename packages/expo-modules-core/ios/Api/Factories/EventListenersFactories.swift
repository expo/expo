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
