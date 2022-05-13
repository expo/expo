// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Class constructor without arguments.
 */
public func Constructor(_ body: @escaping () throws -> ()) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Class constructor with one argument.
 */
public func Constructor<A0: AnyArgument>(_ body: @escaping (A0) throws -> ()) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Class constructor with two arguments.
 */
public func Constructor<A0: AnyArgument, A1: AnyArgument>(_ body: @escaping (A0, A1) throws -> ()) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Class constructor with three arguments.
 */
public func Constructor<A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ body: @escaping (A0, A1, A2) throws -> ()
) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Class constructor with four arguments.
 */
public func Constructor<A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ body: @escaping (A0, A1, A2, A3) throws -> ()
) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Class constructor with five arguments.
 */
public func Constructor<A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ body: @escaping (A0, A1, A2, A3, A4) throws -> ()
) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Class constructor with six arguments.
 */
public func Constructor<A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ body: @escaping (A0, A1, A2, A3, A4, A5) throws -> ()
) -> AnyFunction {
  return Function("constructor", body)
}

/**
 Creates the component describing a JavaScript class.
 */
public func Class(_ name: String, @ClassComponentElementsBuilder _ elements: () -> [ClassComponentElement]) -> ClassComponent {
  return ClassComponent(name: name, elements: elements())
}
