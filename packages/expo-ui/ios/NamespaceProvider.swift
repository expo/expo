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

internal struct NamespaceProvider: ExpoSwiftUI.View {
  @ObservedObject var props: NamespaceProviderProps
  @State private var namespaceCache: [String: Namespace.ID] = [:]
  
  var body: some View {
    Children()
      .environment(\.namespaceProvider, getNamespace)
  }
  
  private func getNamespace(for identifier: String) -> Namespace.ID {
    if let existingNamespace = namespaceCache[identifier] {
      return existingNamespace
    }
    
    let newNamespace = Namespace().wrappedValue
    namespaceCache[identifier] = newNamespace
    return newNamespace
  }
}
