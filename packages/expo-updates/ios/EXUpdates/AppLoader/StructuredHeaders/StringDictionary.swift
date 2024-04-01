//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

public enum SerializerError: Error {
  case emptyKey
  case invalidCharacterInKey(key: String, character: Character)
  case invalidCharacterInString(string: String, character: Character)
}

/**
 Derived from expo-structured-headers Android implementation.
 */
public class StringDictionary {
  private let value: [String: StringItem]

  required init(value: [String : StringItem]) throws {
    self.value = try StringDictionary.checkKeys(value: value)
  }

  private static func checkKeys(value: [String: StringItem]) throws -> [String: StringItem] {
    try value.keys.forEach { key in
      try checkKey(key: key)
    }
    return value
  }

  private static func checkKey(key: String) throws {
    guard !key.isEmpty else {
      throw SerializerError.emptyKey
    }

    for (i, c) in key.enumerated() {
      let failureCondition1 = i == 0 && (c != Character("*") && !c.isLcAlpha)
      let failureCondition2 = !(c.isLcAlpha || c.isDigit || c == Character("_") || c == Character("-") || c == Character(".") || c == Character("*"))
      if failureCondition1 || failureCondition2 {
        throw SerializerError.invalidCharacterInKey(key: key, character: c)
      }
    }
  }

  public func serialize() -> String {
    return value
      .map { (key: String, value: StringItem) in
        return "\(key)=\(value.serialize())"
      }
      .joined(separator: ", ")
  }
}
