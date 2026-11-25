// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Security

protocol KeychainStoring: Sendable {
  func read() -> Data?
  func write(_ data: Data) throws
  func delete()
}

struct KeychainError: Error {
  let status: OSStatus
}

struct KeychainItem: KeychainStoring {
  let key: String
  let service: String

  func read() -> Data? {
    var query = baseQuery
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    query[kSecReturnData as String] = kCFBooleanTrue

    var item: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess else {
      return nil
    }
    return item as? Data
  }

  func write(_ data: Data) throws {
    let attributes: [String: Any] = [
      kSecValueData as String: data,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
    ]
    var status = SecItemAdd(baseQuery.merging(attributes) { _, new in new } as CFDictionary, nil)
    if status == errSecDuplicateItem {
      status = SecItemUpdate(baseQuery as CFDictionary, attributes as CFDictionary)
    }
    guard status == errSecSuccess else {
      throw KeychainError(status: status)
    }
  }

  func delete() {
    SecItemDelete(baseQuery as CFDictionary)
  }

  private var baseQuery: [String: Any] {
    let encodedKey = Data(key.utf8)
    return [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrGeneric as String: encodedKey,
      kSecAttrAccount as String: encodedKey
    ]
  }
}
