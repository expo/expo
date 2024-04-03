//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

/**
 Derived from expo-structured-headers Android implementation.
 */
public class StringList {
  private let value: [StringItem]

  required init(value: [StringItem]) {
    self.value = value
  }

  public func serialize() -> String {
    return value
      .map({ item in
        item.serialize()
      })
      .joined(separator: ", ")
  }
}
