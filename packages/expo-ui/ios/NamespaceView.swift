// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class NamespaceViewProps: ExpoSwiftUI.ViewProps {
  @Field var id: String
}

internal struct NamespaceView: ExpoSwiftUI.View {
  @ObservedObject var props: NamespaceViewProps
  @Namespace var namespace

  init(props: NamespaceViewProps) {
    self.props = props
  }

  var body: some View {
    // We should register the namespace right after view updating.
    // That allows children views to reference the namespace immediately.
    NamespaceRegistry.shared.registerNamespace(namespace, forKey: props.id)

    return Children()
      .onDisappear {
        NamespaceRegistry.shared.unregisterNamespace(forKey: props.id)
      }
  }
}
