// Copyright 2026-present 650 Industries. All rights reserved.

/**
 A coding key carrying just a string and an integer index. Used to extend
 `codingPath` with array indices in unkeyed containers, since unkeyed
 containers have no associated `Key` type to draw from.
 */
internal struct AnyCodingKey: CodingKey {
  let stringValue: String
  let intValue: Int?

  init(stringValue: String) {
    self.stringValue = stringValue
    self.intValue = Int(stringValue)
  }

  init(intValue: Int) {
    self.stringValue = String(intValue)
    self.intValue = intValue
  }
}
