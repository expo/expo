/**
 Creates the read-only constant whose getter doesn't take the owner as an argument.
 */
public func Constant<Value: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ get: @Sendable @escaping () -> Value
) -> ConstantDefinition<Value> {
  return ConstantDefinition(name: name, getter: get)
}
