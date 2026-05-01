/**
 Property wrapper for `Record`'s data members that takes part in the process of serialization to and deserialization from the dictionary.
 For supported field types, see https://docs.expo.dev/modules/module-api/#argument-types
 */
@propertyWrapper
public final class Field<Type: AnyArgument>: AnyFieldInternal, @unchecked Sendable {
  /**
   The wrapped value.
   */
  public var wrappedValue: Type

  internal let fieldType: AnyDynamicType = ~Type.self

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
  internal func set(_ newValue: Any?, appContext: AppContext) throws {
    if newValue == nil && isRequired {
      throw FieldRequiredException(key!)
    }
    do {
      if let value = try castValue(newValue, appContext: appContext) {
        wrappedValue = value
      } else if newValue == nil {
        throw FieldRequiredException(key!)
      }
    } catch {
      if newValue == nil {
        throw FieldRequiredException(key!)
      }
      throw FieldInvalidTypeException((fieldKey: key!, value: newValue, desiredType: Type.self)).causedBy(error)
    }
  }

  @JavaScriptActor
  internal func set(jsValue: JavaScriptValue, appContext: AppContext) throws {
    if jsValue.isNull() && isRequired {
      throw FieldRequiredException(key!)
    }
    do {
      if let value = try castValue(jsValue: jsValue, appContext: appContext) {
        wrappedValue = value
      } else if jsValue.isNull() {
        throw FieldRequiredException(key!)
      }
    } catch {
      if jsValue.isNull() {
        throw FieldRequiredException(key!)
      }
      throw FieldInvalidTypeException((fieldKey: key!, value: jsValue, desiredType: Type.self)).causedBy(error)
    }
  }

  internal func castValue(_ newValue: Any?, appContext: AppContext) throws -> Type? {
    return try fieldType.cast(newValue, appContext: appContext) as? Type
  }

  @JavaScriptActor
  internal func castValue(jsValue: JavaScriptValue, appContext: AppContext) throws -> Type? {
    let rawValue = try fieldType.cast(jsValue: jsValue, appContext: appContext)
    let convertedValue = try fieldType.cast(rawValue, appContext: appContext)
    return convertedValue as? Type
  }
}

internal final class FieldRequiredException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Value for field '\(param)' is required, got nil"
  }
}

internal final class FieldInvalidTypeException: GenericException<(fieldKey: String, value: Any?, desiredType: Any.Type)>, @unchecked Sendable {
  override var reason: String {
    let value = String(describing: param.value ?? "null")
    let desiredType = String(describing: param.desiredType)

    return "Cannot cast '\(value)' for field '\(param.fieldKey)' of type \(desiredType)"
  }
}
