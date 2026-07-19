// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Security

@objc(EXSession)
@objcMembers
public final class Session: NSObject {
  private static let keychainKey = "host.exp.exponent.session"
  private static let keychainService = "app"

  public static let sharedInstance = Session()
  private var cachedSession: NSDictionary?

  private override init() {
    super.init()
  }

  public func session() -> NSDictionary? {
    if let cached = cachedSession {
      return cached
    }

    var query = defaultSearchQuery()
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    query[kSecReturnData as String] = kCFBooleanTrue

    var foundItem: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &foundItem)

    guard status == errSecSuccess,
          let data = foundItem as? Data else {
      return nil
    }

    do {
      if let session = try JSONSerialization.jsonObject(with: data, options: []) as? NSDictionary {
        return session
      }
    } catch {
      NSLog("[EXSession] Error deserializing session: %@", error.localizedDescription)
    }

    return nil
  }

  public func sessionSecret() -> String? {
    guard let session = session() else {
      return nil
    }

    return session["sessionSecret"] as? String
  }

  @objc(saveSessionToKeychain:error:)
  public func saveSession(toKeychain session: NSDictionary) throws {
    let data: Data
    do {
      data = try JSONSerialization.data(withJSONObject: session, options: [])
    } catch {
      throw NSError(
        domain: "EXKernelErrorDomain",
        code: -1,
        userInfo: [
          NSLocalizedDescriptionKey: "Could not serialize JSON to save session to keychain",
          NSUnderlyingErrorKey: error
        ]
      )
    }

    let searchQuery = self.defaultSearchQuery()
    let updateQuery: [String: Any] = [kSecValueData as String: data]

    var addQuery = searchQuery
    addQuery.merge(updateQuery) { _, new in new }

    var status = SecItemAdd(addQuery as CFDictionary, nil)

    if status == errSecDuplicateItem {
      status = SecItemUpdate(searchQuery as CFDictionary, updateQuery as CFDictionary)
    }

    if status == errSecSuccess {
      cachedSession = session
    } else {
      throw NSError(
        domain: "EXKernelErrorDomain",
        code: -1,
        userInfo: [NSLocalizedDescriptionKey: "Could not save session to keychain"]
      )
    }
  }

  @objc(deleteSessionFromKeychainWithError:)
  public func deleteSessionFromKeychain() throws {
    let status = SecItemDelete(defaultSearchQuery() as CFDictionary)

    if status == errSecSuccess || status == errSecItemNotFound {
      cachedSession = nil
    } else {
      throw NSError(
        domain: "EXKernelErrorDomain",
        code: -1,
        userInfo: [NSLocalizedDescriptionKey: "Could not delete session from keychain"]
      )
    }
  }

  private func defaultSearchQuery() -> [String: Any] {
    let encodedKey = Self.keychainKey.data(using: .utf8)!
    return [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: Self.keychainService,
      kSecAttrGeneric as String: encodedKey,
      kSecAttrAccount as String: encodedKey
    ]
  }
}
