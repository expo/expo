/// This file implements definition components that are allowed in any object-based definition — `ObjectDefinition`.
/// So far only constants and functions belong to plain object.

// MARK: - Constants

/**
 Definition function setting the module's constants to export.
 */
@available(*, deprecated, renamed: "Constants")
public func constants(_ body: @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

/**
 Definition function setting the module's constants to export.
 */
public func Constants(_ body: @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

/**
 Definition function setting the module's constants to export.
 */
@available(*, deprecated, renamed: "Constants")
public func constants(_ body: @autoclosure @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

/**
 Definition function setting the module's constants to export.
 */
public func Constants(_ body: @autoclosure @escaping () -> [String: Any?]) -> AnyDefinition {
  return ConstantsDefinition(body: body)
}

// MARK: - Functions

/**
 Function without arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R>(
  _ name: String,
  _ closure: @escaping () throws -> R
) -> AsyncFunctionComponent<(), Void, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Function with one argument.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0) throws -> R
) -> AsyncFunctionComponent<(A0), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self],
    closure
  )
}

/**
 Function with two arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1) throws -> R
) -> AsyncFunctionComponent<(A0, A1), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self, ~A1.self],
    closure
  )
}

/**
 Function with three arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self
    ],
    closure
  )
}

/**
 Function with four arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self
    ],
    closure
  )
}

/**
 Function with five arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self
    ],
    closure
  )
}

/**
 Function with six arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4, A5), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self
    ],
    closure
  )
}

/**
 Function with seven arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4, A5, A6), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self,
      ~A6.self
    ],
    closure
  )
}

/**
 Function with eight arguments.
 */
@available(*, deprecated, renamed: "AsyncFunction")
public func function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4, A5, A6, A7), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self,
      ~A6.self,
      ~A7.self
    ],
    closure
  )
}

// MARK: - Events

/**
 Defines event names that the object can send to JavaScript.
 */
@available(*, deprecated, renamed: "Events")
public func events(_ names: String...) -> AnyDefinition {
  return EventsDefinition(names: names)
}

/**
 Defines event names that the object can send to JavaScript.
 */
public func Events(_ names: String...) -> AnyDefinition {
  return EventsDefinition(names: names)
}

/**
 Function that is invoked when the first event listener is added.
 */
@available(*, deprecated, renamed: "OnStartObserving")
public func onStartObserving(_ body: @escaping () -> Void) -> AsyncFunctionComponent<(), Void, Void> {
  return AsyncFunctionComponent("startObserving", firstArgType: Void.self, dynamicArgumentTypes: [], body)
}

/**
 Function that is invoked when the first event listener is added.
 */
public func OnStartObserving(_ body: @escaping () -> Void) -> AsyncFunctionComponent<(), Void, Void> {
  return AsyncFunctionComponent("startObserving", firstArgType: Void.self, dynamicArgumentTypes: [], body)
}

/**
 Function that is invoked when all event listeners are removed.
 */
@available(*, deprecated, renamed: "OnStopObserving")
public func onStopObserving(_ body: @escaping () -> Void) -> AsyncFunctionComponent<(), Void, Void> {
  return AsyncFunctionComponent("stopObserving", firstArgType: Void.self, dynamicArgumentTypes: [], body)
}

/**
 Function that is invoked when all event listeners are removed.
 */
public func OnStopObserving(_ body: @escaping () -> Void) -> AsyncFunctionComponent<(), Void, Void> {
  return AsyncFunctionComponent("stopObserving", firstArgType: Void.self, dynamicArgumentTypes: [], body)
}
