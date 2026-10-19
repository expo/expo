// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ToggleProps: UIBaseViewProps {
  @Field var isOn: Bool?
  @Field var label: String?
  @Field var systemImage: String?
  var onIsOnChange = EventDispatcher()
}

internal struct ToggleView: ExpoSwiftUI.View {
  @ObservedObject var props: ToggleProps
  // Only used when `isOn` isn't passed. While the prop is set it is the sole source of
  // truth, so JS stays in control of what the toggle shows and can refuse a change.
  @State private var uncontrolled = false

  init(props: ToggleProps) {
    self.props = props
  }

  var body: some View {
    makeToggle(isOn: Binding(
      get: { props.isOn ?? uncontrolled },
      set: { newValue in
        uncontrolled = newValue
        if props.isOn != newValue {
          props.onIsOnChange([
            "isOn": newValue
          ])
        }
      }
    ))
  }

  @ViewBuilder
  private func makeToggle(isOn: Binding<Bool>) -> some View {
    if let systemImage = props.systemImage, let label = props.label {
      Toggle(label, systemImage: systemImage, isOn: isOn)
    } else if let label = props.label {
      Toggle(label, isOn: isOn)
    } else {
      Toggle(isOn: isOn) { Children() }
    }
  }
}
