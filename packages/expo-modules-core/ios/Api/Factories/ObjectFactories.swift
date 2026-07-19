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
@available(*, deprecated, message: "Use `Constant` or `Property` instead")
public func Constants(@_implicitSelfCapture _ body: @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

/**
 Definition function setting the module's constants to export.
 */
@available(*, deprecated, message: "Use `Constant` or `Property` instead")
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
public func OnStartObserving(_ event: String? = nil, @_implicitSelfCapture _ closure: @escaping () -> Void) -> EventObservingDefinition {
  return EventObservingDefinition(type: .startObserving, event: event, closure)
}

/**
 Function that is invoked when all event listeners are removed.
 */
public func OnStopObserving(_ event: String? = nil, @_implicitSelfCapture _ closure: @escaping () -> Void) -> EventObservingDefinition {
  return EventObservingDefinition(type: .stopObserving, event: event, closure)
}
