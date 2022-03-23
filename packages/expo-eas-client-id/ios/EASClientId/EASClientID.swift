// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

public struct EASClientID {
  private static let EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "expo.eas-client-id"

  public static var uuid: UUID = {
    return UUID.init(uuidString: UserDefaults.standard.computeStringIfAbsent(forKey: EAS_CLIENT_ID_SHARED_PREFERENCES_KEY) {
      UUID.init().uuidString
    })!
  }()
}

extension UserDefaults {
  func computeStringIfAbsent(forKey: String, _ compute: () throws -> String) rethrows -> String {
    if let storedValue = string(forKey: forKey) {
      return storedValue
    }
    let computedValue = try compute()
    set(computedValue, forKey: forKey)
    return computedValue
  }
}
