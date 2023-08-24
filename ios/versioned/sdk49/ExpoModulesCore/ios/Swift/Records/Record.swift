/**
 A protocol that allows initializing the object with a dictionary.
 */
public protocol Record: Convertible {
  /**
   The dictionary type that the record can be created from or converted back.
   */
  typealias Dict = [String: Any]

  /**
   The default initializer. It enforces the structs not to have any uninitialized properties.
   */
  init()

  /**
   Initializes a record from given dictionary. Only members wrapped by `@Field` will be set in the object.
   */
  init(from: Dict, appContext: AppContext) throws

  /**
   Converts the record back to the dictionary. Only members wrapped by `@Field` will be set in the dictionary.
   */
  func toDictionary() -> Dict
}

/**
 Provides the default implementation of `Record` protocol.
 */
public extension Record {
  static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    if let value = value as? Dict {
      return try Self(from: value, appContext: appContext)
    }
    throw Conversions.ConvertingException<Self>(value)
  }

  init(from dict: Dict, appContext: AppContext) throws {
    self.init()

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

  func toDictionary() -> Dict {
    return fieldsOf(self).reduce(into: Dict()) { result, field in
      result[field.key!] = Conversions.convertFunctionResult(field.get())
    }
  }
}

/**
 Returns an array of fields found in record's mirror. If the field is missing the `key`,
 it gets assigned to the property label, so after all it's safe to enforce unwrapping it (using `key!`).
 */
private func fieldsOf(_ record: Record) -> [AnyFieldInternal] {
  return Mirror(reflecting: record).children.compactMap { (label: String?, value: Any) in
    guard var field = value as? AnyFieldInternal, let key = field.key ?? convertLabelToKey(label) else {
      return nil
    }
    field.options.insert(.keyed(key))
    return field
  }
}

/**
 Converts mirror's label to field's key by dropping the "_" prefix from wrapped property label.
 */
private func convertLabelToKey(_ label: String?) -> String? {
  return (label != nil && label!.starts(with: "_")) ? String(label!.dropFirst()) : label
}
