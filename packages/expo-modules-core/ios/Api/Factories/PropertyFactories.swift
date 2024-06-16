/**
 Creates the property with given name. The definition is basically no-op if you don't call `.get(_:)` or `.set(_:)` on it.
 */
public func Property(_ name: String) -> PropertyDefinition<Void> {
  return PropertyDefinition(name: name)
}

/**
 Creates the read-only property whose getter doesn't take the owner as an argument.
 */
public func Property<Value: AnyArgument>(_ name: String, @_implicitSelfCapture get: @escaping () -> Value) -> PropertyDefinition<Void> {
  return PropertyDefinition(name: name, getter: get)
}

/**
 Creates the read-only property whose getter takes the owner as an argument.
 */
public func Property<Value: AnyArgument, OwnerType>(
  _ name: String,
  @_implicitSelfCapture get: @escaping (_ this: OwnerType) -> Value
) -> PropertyDefinition<OwnerType> {
  return PropertyDefinition<OwnerType>(name: name, getter: get)
}

/**
 Creates the property that references to an immutable property of the owner object using the key path.
 */
public func Property<Value: AnyArgument, OwnerType>(
  _ name: String,
  _ keyPath: KeyPath<OwnerType, Value>
) -> PropertyDefinition<OwnerType> {
  return PropertyDefinition<OwnerType>(name: name) { owner in
    return owner[keyPath: keyPath]
  }
}

/**
 Creates the property that references to a mutable property of the owner object using the key path.
 */
public func Property<Value: AnyArgument, OwnerType>(
  _ name: String,
  _ keyPath: ReferenceWritableKeyPath<OwnerType, Value>
) -> PropertyDefinition<OwnerType> {
  return PropertyDefinition<OwnerType>(name: name) { owner in
    return owner[keyPath: keyPath]
  }
  .set { owner, newValue in
    owner[keyPath: keyPath] = newValue
  }
}
