//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

internal extension Character {
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
public class StringItem {
  private let value: String

  required init(value: String) throws {
    self.value = try StringItem.checkValue(value: value)
  }

  private static func checkValue(value: String) throws -> String {
    for c in value {
      if c < Character.fromHex("20") || c >= Character.fromHex("7f") {
        throw SerializerError.invalidCharacterInString(string: value, character: c)
      }
    }
    return value
  }

  public func serialize() -> String {
    let escapedString = value.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
    return "\"\(escapedString)\""
  }
}
