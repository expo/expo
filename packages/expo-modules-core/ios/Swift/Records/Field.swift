/**
 Property wrapper for `Record`'s data members that takes part in the process of serialization to and deserialization from the dictionary.
 */
@propertyWrapper
public class Field<Type>: AnyFieldInternal {
  /**
   The wrapped value.
   */
  public var wrappedValue: Type

  /**
   Field's key in the dictionary, which by default is a label of the wrapped property.
   Sadly, property wrappers don't receive properties' label, so we must wait until it's assigned by `Record`.
   */
  internal var key: String? {
    return options.first { $0.rawValue == FieldOption.keyed("").rawValue }?.key
  }

  /**
   Additional options of the field, such is if providing the value is required (`FieldOption.required`).
   */
  internal var options: Set<FieldOption> = Set()

  /**
   Whether the generic field type accepts `nil` values.
   We can't check it directly with `Optional` because it has associated type,
   but all optionals implement non-generic `ExpressibleByNilLiteral` protocol.
   */
  internal var isOptional: Bool {
    return Type.self is ExpressibleByNilLiteral.Type
  }

  /**
   Initializes the field with given value and customized key.
   */
  public init(wrappedValue: Type, _ options: FieldOption...) {
    self.wrappedValue = wrappedValue
    self.options = Set(options)
  }

  /**
   Alternative default initializer implementation. It's not possible yet to pass an array
   as variadic arguments, so we also need to pass an array as a single argument.
   */
  public init(wrappedValue: Type, _ options: [FieldOption]) {
    self.wrappedValue = wrappedValue
    self.options = Set(options)
  }

  /**
   A hacky way to accept optionals without explicit assignment to `nil`. Normally, we would have to do
   `@Field var s: String? = nil` but this init with generic constraint allows us to just do `@Field var s: String?`.
   */
  public init(wrappedValue: Type = nil) where Type: ExpressibleByNilLiteral {
    self.wrappedValue = wrappedValue
  }

  public init(wrappedValue: Type = nil, _ options: FieldOption...) where Type: ExpressibleByNilLiteral {
    self.wrappedValue = wrappedValue
    self.options = Set(options)
  }

  /**
   Returns wrapped value as `Any?` to conform to type-erased `AnyField` protocol.
   */
  public func get() -> Any {
    return wrappedValue
  }

  /**
   Sets the wrapped value with a value of `Any` type.
   */
  internal func set(_ newValue: Any?) throws {
    if newValue == nil && (!isOptional || options.contains(.required)) {
      throw FieldRequiredError(fieldKey: key!)
    }
    if let value = newValue as? Type {
      wrappedValue = value
      return
    }
    throw FieldInvalidTypeError(fieldKey: key!, value: newValue, desiredType: Type.self)
  }
}

internal struct FieldRequiredError: CodedError {
  let fieldKey: String
  var description: String {
    "Value for field `\(fieldKey)` is required, got `nil`"
  }
}

internal struct FieldInvalidTypeError: CodedError {
  let fieldKey: String
  let value: Any?
  let desiredType: Any.Type
  var description: String {
    "Cannot cast value `\(String(describing: value!))` (\(type(of: value!))) for field `\(fieldKey)` (\(String(describing: desiredType)))"
  }
}
