//  Copyright © 2024 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping

import ExpoModulesCore
import UIKit
import MachO

public class ServerRegistrationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NotificationsServerRegistrationModule")

    AsyncFunction("getInstallationIdAsync") { () -> String in
      return try getInstallationId()
    }

    AsyncFunction("getRegistrationInfoAsync") { () -> String? in
      return try getRegistrationInfo()
    }

    AsyncFunction("setRegistrationInfoAsync") { (registrationInfo: String) in
      try setRegistrationInfo(registrationInfo: registrationInfo)
    }
  }

  // MARK: - Installation ID

  private func getInstallationId() throws -> String {
    // If item in keychain, return it
    if let installationId = try getInstallationIdFromKeychain() {
      return installationId
    }

    // Check UserDefaults for legacy ID
    let legacyInstallationId = getLegacyInstallationIdFromUserDefaults()
    if let legacyInstallationId = legacyInstallationId {
      try setInstallationIdInKeychain(legacyInstallationId)
      // If successfully saved in keychain, remove the value from UserDefaults,
      // and return it
      removeLegacyInstallationIdFromUserDefaults()
      return legacyInstallationId
    }

    // Otherwise, create a new UUID and store it in keychain
    let newInstallationId = UUID().uuidString
    try setInstallationIdInKeychain(newInstallationId)
    return newInstallationId
  }

  private func getInstallationIdFromKeychain() throws -> String? {
    try fetchStringWithQuery(installationIdGetQuery())
  }

  private func setInstallationIdInKeychain(_ installationId: String) throws {
    try storeStringWithQueries(search: installationIdSearchQuery(), set: installationIdSetQuery(installationId))
  }

  private func getLegacyInstallationIdFromUserDefaults() -> String? {
    return UserDefaults.standard.string(forKey: kEXDeviceInstallationUUIDLegacyKey)
  }

  private func removeLegacyInstallationIdFromUserDefaults() {
    UserDefaults.standard.removeObject(forKey: kEXDeviceInstallationUUIDLegacyKey)
  }

  private func installationIdSearchQueryMerging(_ dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    return keychainSearchQueryFor(key: kEXDeviceInstallationUUIDKey, dictionaryToMerge: dictionaryToMerge)
  }

  private func installationIdSearchQuery() -> CFDictionary {
    return installationIdSearchQueryMerging([:])
  }

  private func installationIdGetQuery() -> CFDictionary {
    return installationIdSearchQueryMerging([
      kSecMatchLimit: kSecMatchLimitOne,
      kSecReturnData: kCFBooleanTrue!
    ])
  }

  private func installationIdSetQuery(_ deviceInstallationUUID: String) -> CFDictionary {
    return installationIdSearchQueryMerging([
      kSecValueData: deviceInstallationUUID.data(using: .utf8)!,
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    ])
  }

  // MARK: - Registration information

  private func getRegistrationInfo() throws -> String? {
    return try fetchStringWithQuery(registrationGetQuery())
  }

  private func setRegistrationInfo(registrationInfo: String) throws {
    return try storeStringWithQueries(search: registrationSearchQuery(), set: registrationSetQuery(registrationInfo))
  }

  private func registrationSearchQueryMerging(_ dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    return keychainSearchQueryFor(key: kEXRegistrationInfoKey, dictionaryToMerge: dictionaryToMerge)
  }

  private func registrationSearchQuery() -> CFDictionary {
    return registrationSearchQueryMerging([:])
  }

  private func registrationGetQuery() -> CFDictionary {
    return registrationSearchQueryMerging([
      kSecMatchLimit: kSecMatchLimitOne,
      kSecReturnData: kCFBooleanTrue!
    ])
  }

  private func registrationSetQuery(_ registration: String) -> CFDictionary {
    return registrationSearchQueryMerging([
      kSecValueData: registration.data(using: .utf8)!,
      kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ])
  }

  // MARK: - Generic keychain methods

  private func keychainSearchQueryFor(key: String, dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    let encodedKey: Data = key.data(using: .utf8)!
    let bundleIdentifier = Bundle.main.bundleIdentifier ?? ""
    var query: [AnyHashable: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: bundleIdentifier,
      kSecAttrGeneric: encodedKey,
      kSecAttrAccount: encodedKey
    ]
    dictionaryToMerge.forEach { (key: AnyHashable, value: Any) in
      query[key] = value
    }
    return query as CFDictionary
  }

  private func fetchStringWithQuery(_ query: CFDictionary) throws -> String? {
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query, &item)
    if status == errSecSuccess {
      guard let existingItem = item as? Data,
        let installationId = String.init(data: existingItem, encoding: .utf8) else {
        return nil
      }
      return installationId
    }
    if status == errSecItemNotFound {
      return nil
    }
  throw Exception(name: "ERR_NOTIFICATIONS_KEYCHAIN_ACCESS", description: "Keychain access failed, status = \(status)", code: "\(status)")
  }

  private func storeStringWithQueries(search: CFDictionary, set: CFDictionary) throws {
    SecItemDelete(search)
    let status = SecItemAdd(set, nil)
    if status != errSecSuccess {
      throw Exception(name: "ERR_NOTIFICATIONS_KEYCHAIN_ACCESS", description: "Keychain access failed, status = \(status)", code: "\(status)")
    }
  }

  private let kEXDeviceInstallationUUIDKey = "EXDeviceInstallationUUIDKey"
  private let kEXDeviceInstallationUUIDLegacyKey = "EXDeviceInstallationUUIDKey"
  private let kEXRegistrationInfoKey = "EXNotificationRegistrationInfoKey"
}

// swiftlint:enable force_unwrapping
