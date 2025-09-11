// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

@MainActor
internal final class NamespaceRegistry {
  static let shared = NamespaceRegistry()

  private var namespaces: [String: Namespace.ID] = [:]

  func registerNamespace(_ namespace: Namespace.ID, forKey key: String) {
    namespaces[key] = namespace
  }

  func unregisterNamespace(forKey key: String) {
    namespaces.removeValue(forKey: key)
  }

  func removeAll() {
    namespaces.removeAll()
  }

  func namespace(forKey key: String) -> Namespace.ID? {
    return namespaces[key]
  }
}
