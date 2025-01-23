// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class SwitchProps: ExpoSwiftUI.ViewProps {
  @Field var checked: Bool
  @Field var variant: String?
  @Field var label: String?
  var onCheckedChanged = EventDispatcher()
}

struct SwitchView: ExpoSwiftUI.View {
  @EnvironmentObject var props: SwitchProps
  @State var checked: Bool = false

  var body: some View {
    Toggle(isOn: $checked, label: { props.label != nil ? Text(props.label ?? "") : nil })
    .onChange(of: checked, perform: { newValue in
      if props.checked == newValue {
        return
      }
      props.onCheckedChanged([
        "checked": newValue
      ])
    })
    .onReceive(props.objectWillChange, perform: {
      checked = props.checked
    })
    .if(props.variant == "button", transform: {
      $0.toggleStyle(.button)
    })
    .if(props.variant == "checkbox", transform: {
      $0.toggleStyle(IOSCheckboxToggleStyle())
    })
  }
}

struct IOSCheckboxToggleStyle: ToggleStyle {
  func makeBody(configuration: Configuration) -> some View {
    SwiftUI.Button(action: {
      configuration.isOn.toggle()
    }, label: {
      HStack {
        Image(systemName: configuration.isOn ? "checkmark.square" : "square")
        configuration.label
      }
    }).buttonStyle(BorderlessButtonStyle())
  }
}
