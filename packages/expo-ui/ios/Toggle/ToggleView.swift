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
  @State var checked: Bool = false
  
  init(props: ToggleProps) {
    self.props = props
  }

  var body: some View {
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
        guard let newValue else {
          checked = false
          return
        }
        checked = newValue
      }
      .onAppear {
        if let isOn = props.isOn {
          checked = isOn
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
