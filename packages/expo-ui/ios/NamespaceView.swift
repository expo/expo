// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps
internal struct NamespaceViewProps {
  var id: String = ""
}

@ExpoView<NamespaceViewProps>
internal struct NamespaceView: View {
  @Namespace var namespace

  var body: some View {
    // We should register the namespace right after view updating.
    // That allows children views to reference the namespace immediately.
    NamespaceRegistry.shared.registerNamespace(namespace, forKey: props.id)

    return children
      .onDisappear {
        NamespaceRegistry.shared.unregisterNamespace(forKey: props.id)
      }
  }
}
