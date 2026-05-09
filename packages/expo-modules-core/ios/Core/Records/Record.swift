import ExpoModulesJSI

/**
 A protocol that allows initializing the object with a dictionary.
 For supported field types, see https://docs.expo.dev/modules/module-api/#argument-types
 */
public protocol Record: Convertible {
  /**
   The dictionary type that the record can be created from or converted back.
   */
  typealias Dict = [String: Any]

  /**
   The default initializer. It enforces the structs not to have any uninitialized properties.
   */
  nonisolated init()

  /**
   Initializes a record from given dictionary. Only members wrapped by `@Field` will be set in the object.
   */
  init(from: Dict, appContext: AppContext) throws

  /**
   Converts the record back to the dictionary. Only members wrapped by `@Field` will be set in the dictionary.
   */
  func toDictionary(appContext: AppContext?) -> Dict
}

/**
 Describes a single `@Field` of a record at decoding/encoding time. The `key` and
 `isRequired` are pre-computed by the `@Record` macro (or filled in by the `Mirror`
 fallback) so the framework doesn't have to re-derive them from the field's runtime
 options on every record decode.

 `field` is typed as the public `AnyField` because instances of this struct flow back
 from user modules through the `_RecordFieldsProvider` requirement, and a public
 protocol can't reference the internal `AnyFieldInternal`. The `internalField`
 accessor below recovers the internal-only view for use inside this module.
 */
public struct RecordFieldDescriptor {
  public let key: String
  public let isRequired: Bool
  public let field: AnyField

  public init(key: String, isRequired: Bool, field: AnyField) {
    self.key = key
    self.isRequired = isRequired
    self.field = field
  }

  /**
   Internal access to the `AnyFieldInternal` view of the field. Safe by construction:
   `Field<T>` is the only type that conforms to either `AnyField` or `AnyFieldInternal`,
   and it conforms to both, so the cast cannot fail in well-formed code.
   */
  internal var internalField: AnyFieldInternal {
    return field as! AnyFieldInternal
  }
}

/**
 Implementation detail of the `@Record` macro. The macro adds conformance to this protocol
 with a compile-time-generated `_recordFields(of:)`, letting `fieldDescriptorsOf` skip reflection.
 Types that don't opt into `@Record` simply don't conform; `fieldDescriptorsOf` falls back to a `Mirror`
 walk for them. The protocol is `public` only because user-defined records live in modules
 that depend on `expo-modules-core` and need to be able to conform — treat it as private API.
 */
public protocol _RecordFieldsProvider {
  static func _recordFields(of instance: Self) -> [RecordFieldDescriptor]
}

internal protocol RecordJavaScriptValueConvertible {
  @JavaScriptActor
  func toJSValue(appContext: AppContext) throws -> JavaScriptValue
}

/**
 Provides the default implementation of `Record` protocol.
 */
public extension Record {
  static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    if let value = value as? Dict {
      return try Self(from: value, appContext: appContext)
    }
    // It's possible that the current implementation tries to convert a value that is already of the desired type.
    // Handle that gracefully instead of throwing an exception.
    if let record = value as? Self {
      return record
    }
    throw Conversions.ConvertingException<Self>(value)
  }

  init(from dict: Dict, appContext: AppContext) throws {
    self.init()
    try update(withDict: dict, appContext: appContext)
  }

  func update(withDict dict: Dict, appContext: AppContext) throws {
    let dictKeys = dict.keys

    try fieldDescriptorsOf(self).forEach { descriptor in
      if dictKeys.contains(descriptor.key) || descriptor.isRequired {
        try descriptor.internalField.set(dict[descriptor.key], appContext: appContext)
      }
    }
  }

  @JavaScriptActor
  func update(withObject object: borrowing JavaScriptObject, appContext: AppContext) throws {
    // Using a set keeps declared-field lookups O(1) when selectively hydrating the record.
    let propertyNames = Set(object.getPropertyNames())

    try fieldDescriptorsOf(self).forEach { descriptor in
      if propertyNames.contains(descriptor.key) {
        let property = object.getProperty(descriptor.key)

        if property.isUndefined() {
          if descriptor.isRequired {
            try descriptor.internalField.set(nil, appContext: appContext)
          }
          return
        }
        try descriptor.internalField.set(jsValue: property, appContext: appContext)
      } else if descriptor.isRequired {
        try descriptor.internalField.set(nil, appContext: appContext)
      }
    }
  }

  func toDictionary(appContext: AppContext? = nil) -> Dict {
    return fieldDescriptorsOf(self).reduce(into: Dict()) { result, descriptor in
      result[descriptor.key] = Conversions.convertFunctionResult(descriptor.field.get(), appContext: appContext)
    }
  }

  static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? Record {
      return value.toDictionary(appContext: appContext)
    }
    return result
  }

  @JavaScriptActor
  func toJSValue(appContext: AppContext) throws -> JavaScriptValue {
    let object = try appContext.runtime.createObject()

    for descriptor in fieldDescriptorsOf(self) {
      let value = try recordFieldValueToJSValue(
        descriptor.field.get(),
        dynamicType: descriptor.internalField.fieldType,
        appContext: appContext
      )
      object.setProperty(descriptor.key, value: value)
    }
    return object.asValue()
  }
}

/**
 Recursively collects all children from a Mirror, including inherited properties from superclasses.
 */
internal func allMirrorChildren(_ mirror: Mirror) -> [Mirror.Child] {
  var children: [Mirror.Child] = Array(mirror.children)
  if let superclassMirror = mirror.superclassMirror {
    children.append(contentsOf: allMirrorChildren(superclassMirror))
  }
  return children
}

/**
 Returns each `@Field` of a record as a `RecordFieldDescriptor`. Records annotated with
 `@Record` conform to `_RecordFieldsProvider` and use a compile-time-generated method that
 skips reflection and pre-computes `isRequired`. Records that aren't annotated fall back to
 a `Mirror` walk that lazily inserts `.keyed(...)` into each field's options.
 */
internal func fieldDescriptorsOf(_ record: Record) -> [RecordFieldDescriptor] {
  if let provider = record as? any _RecordFieldsProvider {
    return _recordFieldsFromProvider(provider)
  }
  return _recordFieldsFromMirror(record)
}

/**
 Calls `_recordFields(of:)` on the dynamic type of the provider. Pulled out so the existential
 can be opened via the generic helper, which is required to call a `Self`-taking static method
 through `any _RecordFieldsProvider`.
 */
private func _recordFieldsFromProvider<T: _RecordFieldsProvider>(_ provider: T) -> [RecordFieldDescriptor] {
  return T._recordFields(of: provider)
}

/**
 `Mirror`-based fallback for records that aren't annotated with `@Record`. Lazily inserts
 `.keyed(key)` into each field's options under the per-field `Mutex`, matching the historical
 behavior so callers that read `field.key` afterwards keep working. Reads `isRequired` from
 the field's options under the same lock — the macro path skips this entirely.
 */
private func _recordFieldsFromMirror(_ record: Record) -> [RecordFieldDescriptor] {
  let mirror = Mirror(reflecting: record)
  return allMirrorChildren(mirror).compactMap { (label: String?, value: Any) in
    guard let field = value as? AnyFieldInternal, let key = field.key ?? convertLabelToKey(label) else {
      return nil
    }
    field.withOptions { options in
      let alreadyKeyed = options.contains { $0.rawValue == FieldOption.keyed("").rawValue }
      if !alreadyKeyed {
        options.insert(.keyed(key))
      }
    }
    return RecordFieldDescriptor(key: key, isRequired: field.isRequired, field: field)
  }
}

/**
 Converts mirror's label to field's key by dropping the "_" prefix from wrapped property label.
 */
internal func convertLabelToKey(_ label: String?) -> String? {
  return (label != nil && label!.starts(with: "_")) ? String(label!.dropFirst()) : label
}

@JavaScriptActor
internal func recordFieldValueToJSValue(
  _ value: Any,
  dynamicType: AnyDynamicType? = nil,
  appContext: AppContext
) throws -> JavaScriptValue {
  let convertedValue: Any

  if let dynamicType {
    return try dynamicType.convertToJS(value, appContext: appContext)
  }

  convertedValue = Conversions.convertFunctionResult(value, appContext: appContext)
  if Optional.isNil(convertedValue) {
    return .null
  }
  if let jsValue = convertedValue as? JavaScriptValue {
    return jsValue
  }
  return try Conversions.unknownToJavaScriptValue(convertedValue, appContext: appContext)
}
