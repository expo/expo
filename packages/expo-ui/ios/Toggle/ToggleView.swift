// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct ToggleProps {
  public var isOn: Bool?
  public var label: String?
  public var systemImage: String?
  var onIsOnChange: (ToggleChangeEvent) -> Void
}

@Record
struct ToggleChangeEvent {
  var isOn: Bool = false
}

@ExpoView<ToggleProps>
public struct ToggleView: View {
  // Only used when `isOn` isn't passed. While the prop is set it is the sole source of
  // truth, so JS stays in control of what the toggle shows and can refuse a change.
  @State private var uncontrolled = false

  public var body: some View {
    makeToggle(isOn: Binding(
      get: { props.isOn ?? uncontrolled },
      set: { newValue in
        uncontrolled = newValue
        if props.isOn != newValue {
          props.onIsOnChange(ToggleChangeEvent(isOn: newValue))
        }
      }
    ))
    .applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private func makeToggle(isOn: Binding<Bool>) -> some View {
    if let systemImage = props.systemImage, let label = props.label {
      Toggle(label, systemImage: systemImage, isOn: isOn)
    } else if let label = props.label {
      Toggle(label, isOn: isOn)
    } else {
      Toggle(isOn: isOn) { children }
    }
  }
}
