// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ToggleProps: UIBaseViewProps {
  @Field var state: ToggleState?
  @Field var isOn: Bool?
  @Field var label: String?
  @Field var systemImage: String?
  var onIsOnChange = EventDispatcher()
}

internal struct ToggleView: ExpoSwiftUI.View {
  @ObservedObject var props: ToggleProps
  @State var checked: Bool = false

  init(props: ToggleProps) {
    self.props = props
  }

  var body: some View {
    if let state = props.state {
      StatefulToggle(state: state, props: props)
    } else {
      makeToggle()
        .onChange(of: checked) { newValue in
          if props.isOn == newValue {
            return
          }
          props.onIsOnChange([
            "isOn": newValue
          ])
        }
        .onChange(of: props.isOn) { newValue in
          checked = newValue ?? false
        }
        .onAppear {
          checked = props.isOn ?? false
        }
    }
  }

  @ViewBuilder
  private func makeToggle() -> some View {
    if let systemImage = props.systemImage, let label = props.label {
      Toggle(label, systemImage: systemImage, isOn: $checked)
    } else if let label = props.label {
      Toggle(label, isOn: $checked)
    } else {
      Toggle(isOn: $checked) { Children() }
    }
  }
}

// MARK: - State-observed toggle

private struct StatefulToggle: View {
  @ObservedObject var state: ToggleState
  @ObservedObject var props: ToggleProps

  var body: some View {
    if let systemImage = props.systemImage, let label = props.label {
      Toggle(label, systemImage: systemImage, isOn: $state.isOn)
    } else {
      Toggle(props.label ?? "", isOn: $state.isOn)
    }
  }
}
