// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoNotifications

// swiftlint:disable:next type_name
public final class ExpoGoNotificationsServerRegistrationModule: ServerRegistrationModule {
  private let scopeKey: String
  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:scopeKey:) instead")
  }

  required init(appContext: AppContext, scopeKey: String) {
    self.scopeKey = scopeKey

    super.init(appContext: appContext)
  }

  override public func registrationSearchQueryMerging(_ dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    let scopedKey = "\(ServerRegistrationModule.kEXRegistrationInfoKey)-\(scopeKey)"
    return keychainSearchQueryFor(key: scopedKey, dictionaryToMerge: dictionaryToMerge)
  }
}
