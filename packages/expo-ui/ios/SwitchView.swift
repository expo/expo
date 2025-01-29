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
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  @State var checked: Bool = false

  var body: some View {
    ExpoSwiftUI.AutoSizingStack(shadowNodeProxy: shadowNodeProxy, axis: .both) {
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
      #if !os(tvOS)
      .if(props.variant == "button") {
        $0.toggleStyle(.button)
      }
      #endif
      .if(props.variant == "checkbox") {
        $0.toggleStyle(IOSCheckboxToggleStyle())
      }
      .fixedSize()
    }
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
    })
    .if(props.variant == "button") {
      if #available(iOS 15.1, tvOS 17.0, *) {
        $0.buttonStyle(BorderlessButtonStyle())
      } else {
        $0.buttonStyle(BorderedButtonStyle())
      }
    }
  }
}
