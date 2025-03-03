/**
 Creates the read-only constant with the given name. The definition is no-op if you don't call `.get(_:)` on it.
 */
public func Constant<Value: AnyArgument>(_ name: String) -> ConstantDefinition<Value> {
  return ConstantDefinition(name: name)
}

/**
 Creates the read-only constant whose getter doesn't take the owner as an argument.
 */
public func Constant<Value: AnyArgument>(_ name: String, @_implicitSelfCapture get: @escaping () -> Value) -> ConstantDefinition<Value> {
  return ConstantDefinition(name: name, getter: get)
}
