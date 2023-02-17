// Copyright 2015-present 650 Industries. All rights reserved.

extension Dictionary where Key == String {
  func optionalValue<T>(forKey: String) -> T? {
    guard let value = self[forKey] else {
      return nil
    }
    precondition(value is T, String(format: "Value for (key = %@) incorrect type", forKey))
    return (value as! T)
  }

  func requiredValue<T>(forKey: String) -> T {
    let value = self[forKey]
    precondition(value != nil, String(format: "Value for (key = %@) should not be null", forKey))
    precondition(value is T, String(format: "Value for (key = %@) incorrect type", forKey))
    return value as! T
  }
}

extension Optional {
  func `let`<U>(_ transform: (_ it: Wrapped) throws -> U?) rethrows -> U? {
    if let x = self {
      return try transform(x)
    }
    return nil
  }
}
