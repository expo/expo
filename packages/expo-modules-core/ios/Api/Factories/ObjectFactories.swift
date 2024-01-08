/// This file implements factories for definitions that are allowed in any object-based definition — `ObjectDefinition`.
/// So far only constants and functions belong to plain object.

// MARK: - Object

public func Object(@ObjectDefinitionBuilder @_implicitSelfCapture _ body: () -> [AnyDefinition]) -> ObjectDefinition {
  return ObjectDefinition(definitions: body())
}

// MARK: - Constants

/**
 Definition function setting the module's constants to export.
 */
public func Constants(@_implicitSelfCapture _ body: @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

/**
 Definition function setting the module's constants to export.
 */
public func Constants(@_implicitSelfCapture _ body: @autoclosure @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

// MARK: - Events

/**
 Defines event names that the object can send to JavaScript.
 */
public func Events(_ names: String...) -> EventsDefinition {
  return EventsDefinition(names: names)
}

/**
 Defines event names that the object can send to JavaScript.
 */
public func Events(_ names: [String]) -> EventsDefinition {
  return EventsDefinition(names: names)
}

/**
 Function that is invoked when the first event listener is added.
 */
public func OnStartObserving(@_implicitSelfCapture _ body: @escaping () -> Void) -> AsyncFunctionDefinition<(), Void, Void> {
  return AsyncFunctionDefinition("startObserving", firstArgType: Void.self, dynamicArgumentTypes: [], body)
}

/**
 Function that is invoked when all event listeners are removed.
 */
public func OnStopObserving(@_implicitSelfCapture _ body: @escaping () -> Void) -> AsyncFunctionDefinition<(), Void, Void> {
  return AsyncFunctionDefinition("stopObserving", firstArgType: Void.self, dynamicArgumentTypes: [], body)
}
