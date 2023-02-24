// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Class constructor without arguments.
 */
public func Constructor<R>(
  @_implicitSelfCapture _ body: @escaping () throws -> R
) -> SyncFunctionComponent<(), Void, R> {
  return Function("constructor", body)
}

/**
 Class constructor with one argument.
 */
public func Constructor<R, A0: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0) throws -> R
) -> SyncFunctionComponent<(A0), A0, R> {
  return Function("constructor", body)
}

/**
 Class constructor with two arguments.
 */
public func Constructor<R, A0: AnyArgument, A1: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0, A1) throws -> R
) -> SyncFunctionComponent<(A0, A1), A0, R> {
  return Function("constructor", body)
}

/**
 Class constructor with three arguments.
 */
public func Constructor<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0, A1, A2) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2), A0, R> {
  return Function("constructor", body)
}

/**
 Class constructor with four arguments.
 */
public func Constructor<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0, A1, A2, A3) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3), A0, R> {
  return Function("constructor", body)
}

/**
 Class constructor with five arguments.
 */
public func Constructor<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3, A4), A0, R> {
  return Function("constructor", body)
}

/**
 Class constructor with six arguments.
 */
public func Constructor<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3, A4, A5), A0, R> {
  return Function("constructor", body)
}

/**
 Creates the component describing a JavaScript class.
 */
public func Class(
  _ name: String,
  @ClassComponentElementsBuilder<JavaScriptObject> @_implicitSelfCapture _ elements: () -> [AnyClassComponentElement]
) -> ClassComponent {
  return ClassComponent(name: name, associatedType: JavaScriptObject.self, elements: elements())
}

/**
 Creates the component describing a JavaScript class with an associated native shared object class.
 */
public func Class<SharedObjectType: SharedObject>(
  _ name: String = String(describing: SharedObjectType.self),
  _ sharedObjectType: SharedObjectType.Type,
  @ClassComponentElementsBuilder<SharedObjectType> @_implicitSelfCapture _ elements: () -> [AnyClassComponentElement]
) -> ClassComponent {
  return ClassComponent(name: name, associatedType: SharedObjectType.self, elements: elements())
}

/**
 Creates the component describing a JavaScript class with an associated native shared object class
 and with the name that is inferred from the shared object type.
 */
public func Class<SharedObjectType: SharedObject>(
  _ sharedObjectType: SharedObjectType.Type,
  @ClassComponentElementsBuilder<SharedObjectType> @_implicitSelfCapture _ elements: () -> [AnyClassComponentElement]
) -> ClassComponent {
  return ClassComponent(name: String(describing: SharedObjectType.self), associatedType: SharedObjectType.self, elements: elements())
}
