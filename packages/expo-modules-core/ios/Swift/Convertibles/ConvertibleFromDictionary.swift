
/**
 A protocol that allows initializing the object with a dictionary.
 */
public protocol ConvertibleFromDictionary: AnyMethodArgument {
  init()
  init(dictionary: [AnyHashable : Any?])
}

/**
 Provides the default implementation of `ConvertibleFromDictionary` protocol.
 */
extension ConvertibleFromDictionary {
  init(dictionary: [AnyHashable : Any?]) {
    self.init()
    let mirror = Mirror(reflecting: self)

    for (label, value) in mirror.children {
      guard let label = label else {
        continue
      }

      let key = label.starts(with: "_") ? String(label.dropFirst()) : label

      if let value = value as? AnyDictionaryValue {
        if let valueInDict = dictionary[key] {
          value.set(valueInDict)
          print(key, value, value.get())
        }
      }
    }
  }
}

protocol AnyDictionaryValue {
  func get() -> Any?
  func set(_ newValue: Any?)
}

@propertyWrapper
public class DictionaryValue<Type>: AnyDictionaryValue {
  public private(set) var wrappedValue: Type

  public init(wrappedValue: Type) {
    self.wrappedValue = wrappedValue
  }

  func get() -> Any? {
    return wrappedValue
  }

  func set(_ newValue: Any?) {
    self.wrappedValue = newValue as! Type
  }
}

//struct TestStruct: ConvertibleFromDictionary {
//  @DictionaryValue
//  var property: Int = 0
//}
