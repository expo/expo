// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

private struct NamespaceProviderKey: EnvironmentKey {
  static let defaultValue: ((String) -> Namespace.ID)? = nil
}

extension EnvironmentValues {
  var namespaceProvider: ((String) -> Namespace.ID)? {
    get { self[NamespaceProviderKey.self] }
    set { self[NamespaceProviderKey.self] = newValue }
  }
}

internal final class NamespaceProviderProps: ExpoSwiftUI.ViewProps {}

private final class NamespaceCache {
  private var cache: [String: Namespace.ID] = [:]

  func getOrCreate(for identifier: String) -> Namespace.ID {
    if let existingNamespace = cache[identifier] {
      return existingNamespace
    }
    let newNamespace = Namespace().wrappedValue
    cache[identifier] = newNamespace
    return newNamespace
  }
}

internal struct NamespaceProvider: ExpoSwiftUI.View {
  @ObservedObject var props: NamespaceProviderProps
  @Namespace private var namespace1
  @Namespace private var namespace2
  @Namespace private var namespace3
  private let namespaceCache = NamespaceCache()

  var body: some View {
    Children()
      .environment(\.namespaceProvider, provideNamespace)
  }

  private func provideNamespace(for identifier: String) -> Namespace.ID {
    switch identifier {
    case "$1":
      return namespace1
    case "$2":
      return namespace2
    case "$3":
      return namespace3
    default:
      // Dynamic namespace triggers warning in SwiftUI and usage is discouraged.
      // Try to use the static namespaces first.
      return namespaceCache.getOrCreate(for: identifier)
    }
  }
}
