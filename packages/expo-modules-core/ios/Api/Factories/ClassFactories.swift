// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Class constructor without arguments.
 */
public func Constructor<R>(
  @_implicitSelfCapture _ body: @escaping () throws -> R
) -> SyncFunctionDefinition<(), Void, R> {
  return Function("constructor", body)
}

/**
 Class constructor with one or more arguments.
 */
public func Constructor<R, A0: AnyArgument, each A: AnyArgument>(
  @_implicitSelfCapture _ body: @escaping (A0, repeat each A) throws -> R
) -> SyncFunctionDefinition<(A0, repeat each A), A0, R> {
  return Function("constructor", body)
}

/**
 Creates the definition describing a JavaScript class.
 */
public func Class(
  _ name: String,
  @ClassDefinitionBuilder<JavaScriptObject> @_implicitSelfCapture _ elements: () -> [AnyClassDefinitionElement]
) -> ClassDefinition {
  return ClassDefinition(name: name, associatedType: JavaScriptObject.self, elements: elements())
}

/**
 Creates the definition describing a JavaScript class with an associated native shared object class.
 */
public func Class<SharedObjectType: SharedObject>(
  _ name: String = String(describing: SharedObjectType.self),
  _ sharedObjectType: SharedObjectType.Type,
  @ClassDefinitionBuilder<SharedObjectType> @_implicitSelfCapture _ elements: () -> [AnyClassDefinitionElement]
) -> ClassDefinition {
  return ClassDefinition(name: name, associatedType: SharedObjectType.self, elements: elements())
}

/**
 Creates the definition describing a JavaScript class with an associated native shared object class
 and with the name that is inferred from the shared object type.
 */
public func Class<SharedObjectType: SharedObject>(
  _ sharedObjectType: SharedObjectType.Type,
  @ClassDefinitionBuilder<SharedObjectType> @_implicitSelfCapture _ elements: () -> [AnyClassDefinitionElement]
) -> ClassDefinition {
  return ClassDefinition(name: String(describing: SharedObjectType.self), associatedType: SharedObjectType.self, elements: elements())
}
