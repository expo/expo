/**
 Property wrapper for `Record`'s data members that takes part in the process of serialization to and deserialization from the dictionary.
 */
@propertyWrapper
public final class Field<Type>: AnyFieldInternal {
  /**
   The wrapped value.
   */
  public var wrappedValue: Type

  private let fieldType: AnyArgumentType = ArgumentType(Type.self)

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
   */
  internal var isOptional: Bool {
    return fieldType is OptionalArgumentType
  }

  internal var isRequired: Bool {
    options.contains(.required)
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
    if newValue == nil && (!isOptional || isRequired) {
      throw FieldRequiredError(fieldKey: key!)
    }
    guard let value = try? fieldType.cast(newValue) as? Type else {
      throw FieldInvalidTypeError(fieldKey: key!, value: newValue, desiredType: Type.self)
    }
    wrappedValue = value
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
