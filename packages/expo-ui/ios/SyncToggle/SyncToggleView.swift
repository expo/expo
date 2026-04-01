// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class SyncToggleProps: UIBaseViewProps {
  @Field var isOn: ObservableState?
  @Field var label: String?
  @Field var systemImage: String?
}

internal struct SyncToggleView: ExpoSwiftUI.View {
  @ObservedObject var props: SyncToggleProps

  init(props: SyncToggleProps) {
    self.props = props
  }

  var body: some View {
    if let state = props.isOn {
      StatefulToggle(state: state, props: props)
    }
  }
}

private struct StatefulToggle: View {
  @ObservedObject var state: ObservableState
  @ObservedObject var props: SyncToggleProps

  var body: some View {
    let isOn = state.binding(false)
    if let systemImage = props.systemImage, let label = props.label {
      Toggle(label, systemImage: systemImage, isOn: isOn)
    } else {
      Toggle(props.label ?? "", isOn: isOn)
    }
  }
}
