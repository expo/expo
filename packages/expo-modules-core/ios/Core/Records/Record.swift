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
   Reads the record's members off a `JavaScriptObject`. The `@Field`-based default goes through
   reflection (`init()` + `update(withObject:)`); the `@Record` macro overrides it with a direct,
   factory that reads each stored property by its declared type.
   */
  @JavaScriptActor
  static func from(object: borrowing JavaScriptObject, appContext: AppContext) throws -> Self

  /**
   Reads the record's members from a `[String: Any]` dictionary. The `@Field`-based default goes
   through reflection (`init()` + `update(withDict:)`); the `@Record` macro overrides it with a
   direct, statically-typed factory.
   */
  static func from(dictionary: Dict, appContext: AppContext) throws -> Self

  /**
   Converts the record back to the dictionary. Only members wrapped by `@Field` will be set in the dictionary.
   */
  func toDictionary(appContext: AppContext?) -> Dict

  /**
   Converts the record to a `JavaScriptObject`. The `@Field`-based default builds the object via
   reflection; the `@Record` macro overrides it with a direct, statically-typed conversion.
   */
  @JavaScriptActor
  func toObject(appContext: AppContext) throws -> JavaScriptObject
}

/**
 Adopted by record-like types that produce a `JavaScriptObject` directly but aren't themselves a
 `Record` — currently just `FormattedRecord`. Lets `DynamicConvertibleType` take the direct
 object-building path for them, same as for records.
 */
internal protocol RecordObjectConvertible {
  @JavaScriptActor
  func toObject(appContext: AppContext) throws -> JavaScriptObject
}

/**
 Thrown by a synthesized record's factories when a required property is missing from the source.
 Public because the `@Record`-generated code lives in user modules and references it directly.
 The `@Field`-based path has its own internal `FieldRequiredException`.
 */
public final class RecordPropertyRequiredException: GenericException<String>, @unchecked Sendable {
  override public var reason: String {
    return "Value for property '\(param)' is required, got nil"
  }
}

/**
 Provides the default implementation of `Record` protocol.
 */
public extension Record {
  static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    if let value = value as? Dict {
      // `from(dictionary:)` dispatches dynamically — reflection for `@Field` records, the
      // synthesized factory for `@Record` ones — so both read correctly off a dictionary.
      return try Self.from(dictionary: value, appContext: appContext)
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

  @JavaScriptActor
  static func from(object: borrowing JavaScriptObject, appContext: AppContext) throws -> Self {
    // Reflection-based default for `@Field` records. The `@Record` macro synthesizes a direct,
    // statically-typed override that takes precedence over this.
    let record = Self()
    try record.update(withObject: object, appContext: appContext)
    return record
  }

  static func from(dictionary: Dict, appContext: AppContext) throws -> Self {
    // Reflection-based default for `@Field` records. The `@Record` macro synthesizes a direct,
    // statically-typed override that takes precedence over this. Delegates to `init(from:appContext:)`
    // so any custom dictionary initializer a record provides still runs.
    return try Self(from: dictionary, appContext: appContext)
  }

  func update(withDict dict: Dict, appContext: AppContext) throws {
    let dictKeys = dict.keys

    try fieldsOf(self).forEach { field in
      guard let key = field.key else {
        // This should never happen, but just in case skip fields without the key.
        return
      }
      if dictKeys.contains(key) || field.isRequired {
        try field.set(dict[key], appContext: appContext)
      }
    }
  }

  @JavaScriptActor
  func update(withObject object: borrowing JavaScriptObject, appContext: AppContext) throws {
    // Using a set keeps declared-field lookups O(1) when selectively hydrating the record.
    let propertyNames = Set(object.getPropertyNames())

    try fieldsOf(self).forEach { field in
      guard let key = field.key else {
        return
      }
      if propertyNames.contains(key) {
        let property = object.getProperty(key)

        if property.isUndefined() {
          if field.isRequired {
            try field.set(nil, appContext: appContext)
          }
          return
        }
        try field.set(jsValue: property, appContext: appContext)
      } else if field.isRequired {
        try field.set(nil, appContext: appContext)
      }
    }
  }

  func toDictionary(appContext: AppContext? = nil) -> Dict {
    return fieldsOf(self).reduce(into: Dict()) { result, field in
      if let key = field.key {
        result[key] = Conversions.convertFunctionResult(field.get(), appContext: appContext)
      }
    }
  }

  static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? Record {
      return value.toDictionary(appContext: appContext)
    }
    return result
  }

  @JavaScriptActor
  func toObject(appContext: AppContext) throws -> JavaScriptObject {
    let object = try appContext.runtime.createObject()

    for field in fieldsOf(self) {
      guard let key = field.key else {
        continue
      }
      let value = try recordFieldValueToJSValue(field.get(), dynamicType: field.fieldType, appContext: appContext)
      object.setProperty(key, value: value)
    }
    return object
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
 The static field layout of a record type: for each `@Field`-wrapped property, the index of its
 child in `allMirrorChildren(...)` (in order) and its resolved dictionary key.

 The layout is the same for every instance of a given record type, so it's computed once (by
 reflecting the first instance) and cached. Caching skips, on every subsequent decode, the
 per-child `as? AnyFieldInternal` conformance check on non-field children, the
 `convertLabelToKey` key derivation, and the key lookup — which a Time Profiler trace showed to
 be the bulk of `fieldsOf` cost. The `@Field` instances themselves are per-object (they hold the
 wrapped values), so those are still read from the instance's mirror.
 */
private struct RecordFieldLayout {
  /// For each field child, its index in `allMirrorChildren(...)` and its resolved key.
  let fields: [(index: Int, key: String)]
}

private let recordFieldLayoutCache = Mutex<[ObjectIdentifier: RecordFieldLayout]>([:])

private func recordFieldLayout(for children: [Mirror.Child], type: ObjectIdentifier) -> RecordFieldLayout {
  if let cached = recordFieldLayoutCache.withLock({ $0[type] }) {
    return cached
  }
  var fields: [(index: Int, key: String)] = []
  for (index, child) in children.enumerated() {
    guard let field = child.value as? AnyFieldInternal,
          let key = field.key ?? convertLabelToKey(child.label) else {
      continue
    }
    fields.append((index: index, key: key))
  }
  let layout = RecordFieldLayout(fields: fields)
  recordFieldLayoutCache.withLock { $0[type] = layout }
  return layout
}

/**
 Returns an array of fields found in record's mirror. If the field is missing the `key`,
 it gets assigned to the property label, so after all it's safe to enforce unwrapping it (using `key!`).
 This function supports inheritance by recursively traversing the superclass hierarchy.

 The field layout (which children are fields, and their keys) is cached per record type; only the
 per-instance `@Field` objects and the idempotent key injection happen on each call.
 */
internal func fieldsOf(_ record: Record) -> [AnyFieldInternal] {
  let mirror = Mirror(reflecting: record)
  let children = allMirrorChildren(mirror)
  let layout = recordFieldLayout(for: children, type: ObjectIdentifier(type(of: record)))

  var result: [AnyFieldInternal] = []
  result.reserveCapacity(layout.fields.count)

  for entry in layout.fields {
    // The layout was built from a mirror of the same type, so the index maps to the matching
    // field child here too; the cast is on a known field child (no wasted casts on non-fields).
    guard let field = children[entry.index].value as? AnyFieldInternal else {
      continue
    }
    field.withOptions { options in
      let alreadyKeyed = options.contains { $0.rawValue == FieldOption.keyed("").rawValue }
      if !alreadyKeyed {
        options.insert(.keyed(entry.key))
      }
    }
    result.append(field)
  }
  return result
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
