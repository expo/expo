// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwitchProps: UIBaseViewProps {
  @Field var value: Bool
  @Field var variant: String?
  @Field var label: String?
  @Field var systemImage: String?
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
    toggleView
    .onChange(of: checked, perform: { newValue in
      if props.value == newValue {
        return
      }
      props.onValueChange([
        "value": newValue
      ])
    })
    .tint(props.color)
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
  
  @ViewBuilder
  private var toggleView: some View {
      if let systemImage = props.systemImage, !systemImage.isEmpty {
        Toggle(props.label ?? "", systemImage: systemImage, isOn: $checked)
      } else {
        Toggle(props.label ?? "", isOn: $checked)
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
