// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps
public struct NamespaceViewProps {
  var namespaceId: String = ""
}

@ExpoView<NamespaceViewProps>
public struct NamespaceView: View {
  @Namespace var namespace

  public var body: some View {
    // We should register the namespace right after view updating.
    // That allows children views to reference the namespace immediately.
    NamespaceRegistry.shared.registerNamespace(namespace, forKey: props.namespaceId)

    return children
      .onDisappear {
        NamespaceRegistry.shared.unregisterNamespace(forKey: props.namespaceId)
      }
  }
}
