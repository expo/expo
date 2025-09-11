// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwitchProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var value: Bool
  @Field var variant: String?
  @Field var label: String?
  @Field var color: Color?
  var onValueChange = EventDispatcher()
}

struct SwitchView: ExpoSwiftUI.View {
  @ObservedObject var props: SwitchProps
  @State var checked: Bool = false

  init(props: SwitchProps) {
    self.props = props
  }

  var body: some View {
    Toggle(isOn: $checked, label: { props.label != nil ? Text(props.label ?? "") : nil })
    .onChange(of: checked, perform: { newValue in
      if props.value == newValue {
        return
      }
      props.onValueChange([
        "value": newValue
      ])
    })
    .tint(props.color)
    .modifier(CommonViewModifiers(props: props))
    .onReceive(props.objectWillChange, perform: {
      checked = props.value
    })
    .onAppear {
      checked = props.value
    }
    #if !os(tvOS)
    .if(props.variant == "button") {
      $0.toggleStyle(.button)
    }
    #endif
    .if(props.variant == "checkbox") {
      $0.toggleStyle(IOSCheckboxToggleStyle())
    }
  }
}

struct IOSCheckboxToggleStyle: ToggleStyle {
  func makeBody(configuration: Configuration) -> some View {
    if #available(iOS 15.1, tvOS 17.0, *) {
      SwiftUI.Button(action: {
        configuration.isOn.toggle()
      }, label: {
        HStack {
          Image(systemName: configuration.isOn ? "checkmark.square" : "square")
          configuration.label
        }
      })
      .buttonStyle(BorderlessButtonStyle())
    } else {
      SwiftUI.Button(action: {
        configuration.isOn.toggle()
      }, label: {
        HStack {
          Image(systemName: configuration.isOn ? "checkmark.square" : "square")
          configuration.label
        }
      })
      .buttonStyle(BorderedButtonStyle())
    }
  }
}
