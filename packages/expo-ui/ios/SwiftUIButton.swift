// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUIButtonProps: ExpoSwiftUI.ViewProps {
  @Field var text: String = ""
  var onButtonPressed = EventDispatcher()
}

struct SwiftUIButton: ExpoSwiftUI.View {
  @ObservedObject var props: SwiftUIButtonProps

  var body: some View {
    SwiftUI.Button(
      action: {
        props.onButtonPressed()
      },
      label: {
        Text(props.text)
      }
    )
  }
}
