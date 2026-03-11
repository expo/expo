//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class ServerRegistrationModule: Module {
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
    return UserDefaults.standard.string(forKey: ServerRegistrationModule.kEXDeviceInstallationUUIDLegacyKey)
  }

  private func removeLegacyInstallationIdFromUserDefaults() {
    UserDefaults.standard.removeObject(forKey: ServerRegistrationModule.kEXDeviceInstallationUUIDLegacyKey)
  }

  private func installationIdSearchQueryMerging(_ dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    return keychainSearchQueryFor(key: ServerRegistrationModule.kEXDeviceInstallationUUIDKey, dictionaryToMerge: dictionaryToMerge)
  }

  private func installationIdSearchQuery() -> CFDictionary {
    return installationIdSearchQueryMerging([:])
  }

  private func installationIdGetQuery() -> CFDictionary {
    return installationIdSearchQueryMerging([
      kSecMatchLimit: kSecMatchLimitOne,
      kSecReturnData: CFTrue
    ])
  }

  private func installationIdSetQuery(_ deviceInstallationUUID: String) -> CFDictionary {
    return installationIdSearchQueryMerging([
      kSecValueData: dataFromString(deviceInstallationUUID),
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

  open func registrationSearchQueryMerging(_ dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    return keychainSearchQueryFor(key: ServerRegistrationModule.kEXRegistrationInfoKey, dictionaryToMerge: dictionaryToMerge)
  }

  private func registrationSearchQuery() -> CFDictionary {
    return registrationSearchQueryMerging([:])
  }

  private func registrationGetQuery() -> CFDictionary {
    return registrationSearchQueryMerging([
      kSecMatchLimit: kSecMatchLimitOne,
      kSecReturnData: CFTrue
    ])
  }

  private func registrationSetQuery(_ registration: String) -> CFDictionary {
    return registrationSearchQueryMerging([
      kSecValueData: dataFromString(registration),
      kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ])
  }

  // MARK: - Generic keychain methods

  public func keychainSearchQueryFor(key: String, dictionaryToMerge: [AnyHashable: Any]) -> CFDictionary {
    let encodedKey: Data = dataFromString(key)
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
    throw keychainException(status)
  }

  private func storeStringWithQueries(search: CFDictionary, set: CFDictionary) throws {
    SecItemDelete(search)
    let status = SecItemAdd(set, nil)
    if status != errSecSuccess {
      throw keychainException(status)
    }
  }

  private func keychainException(_ status: OSStatus) -> Exception {
    let statusString = SecCopyErrorMessageString(status, nil) as? String ?? "\(status)"
    return Exception(name: "ERR_NOTIFICATIONS_KEYCHAIN_ACCESS", description: "Keychain access failed: \(statusString)", code: "\(status)")
  }

  private func dataFromString(_ input: String) -> Data {
    if let data = input.data(using: .utf8) {
      return data
    }
    // If the above fails, find the fastest encoding that can be used without loss,
    // guaranteeing a non-null result, and a safe force-unwrapping
    let fastEncoding = input.fastestEncoding
    // swiftlint:disable:next force_unwrapping
    return input.data(using: fastEncoding)!
  }

  public static let kEXDeviceInstallationUUIDKey = "EXDeviceInstallationUUIDKey"
  public static let kEXDeviceInstallationUUIDLegacyKey = "EXDeviceInstallationUUIDKey"
  public static let kEXRegistrationInfoKey = "EXNotificationRegistrationInfoKey"
  private let CFTrue = true as CFBoolean
}
