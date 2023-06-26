//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

public enum SerializerError: Error {
  case emptyKey
  case invalidCharacterInKey(key: String, character: Character)
  case invalidCharacterInString(string: String, character: Character)
}

private extension Character {
  static func fromHex(_ hex: String) -> Character {
    // swiftlint:disable:next force_unwrapping
    return Character(Unicode.Scalar(Int(hex, radix: 16)!)!)
  }

  var isDigit: Bool {
    return self >= Character("0") && self <= Character("9")
  }

  var isLcAlpha: Bool {
    self >= Character("a") && self <= Character("z")
  }

  var isAlpha: Bool {
    return (self >= Character("A") && self <= Character("Z")) || isLcAlpha
  }
}

/**
 Derived from expo-structured-headers Android implementation.
 */
public class StringStringDictionarySerializer {
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

  private static func checkValue(value: String) throws {
    for c in value {
      if c < Character.fromHex("20") || c >= Character.fromHex("7f") {
        throw SerializerError.invalidCharacterInString(string: value, character: c)
      }
    }
  }

  private static func serializeValue(value: String) -> String {
    let escapedString = value.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
    return "\"\(escapedString)\""
  }

  public static func serialize(dictionary: [String: String]) throws -> String {
    return try dictionary
      .map { (key: String, value: String) in
        try checkKey(key: key)
        try checkValue(value: value)
        return "\(key)=\(serializeValue(value: value))"
      }
      .joined(separator: ", ")
  }
}
