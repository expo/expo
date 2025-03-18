// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUISwitchProps: ExpoSwiftUI.ViewProps {
  @Field var label: String = ""
  @Field var value: Bool = false
  var onValueChange = EventDispatcher()
}

struct SwiftUISwitch: ExpoSwiftUI.View {
  @ObservedObject var props: SwiftUISwitchProps
  @State var value: Bool = false

  init(props: SwiftUISwitchProps) {
    self.props = props
  }

  var body: some View {
    Toggle(isOn: $value, label: { Text(props.label) })
    .onChange(of: value, perform: { newValue in
      if props.value == newValue {
        return
      }
      props.onValueChange([
        "value": newValue
      ])
    })
  }
}
