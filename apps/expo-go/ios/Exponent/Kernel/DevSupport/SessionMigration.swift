// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum SessionMigration {
  static let legacySessionKey = "expo-session-secret"
  static let legacyUsernameKey = "expo-username"
  static let legacySelectedAccountKey = "expo-selected-account-id"
  static let legacyExpiresAtKey = "expo-session-expires-at"

  static func migrateIfNeeded(into store: SessionStore, legacyKeychain: KeychainStoring, defaults: UserDefaults) {
    let secret = defaults.string(forKey: legacySessionKey) ?? legacyKeychainSecret(legacyKeychain)
    if let secret, !secret.isEmpty, store.sessions.isEmpty {
      let expiresAt = (defaults.object(forKey: legacyExpiresAtKey) as? Double).map(Date.init(timeIntervalSince1970:))
      store.add(
        sessionSecret: secret,
        expiresAt: expiresAt,
        username: defaults.string(forKey: legacyUsernameKey),
        selectedAccountId: defaults.string(forKey: legacySelectedAccountKey)
      )
    }
    [legacySessionKey, legacyUsernameKey, legacySelectedAccountKey, legacyExpiresAtKey].forEach(defaults.removeObject(forKey:))
    legacyKeychain.delete()
  }

  private static func legacyKeychainSecret(_ keychain: KeychainStoring) -> String? {
    guard let data = keychain.read(),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return nil
    }
    return json["sessionSecret"] as? String
  }
}
