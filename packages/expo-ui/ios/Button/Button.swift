// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct Button: ExpoSwiftUI.View {
  @ObservedObject var props: ButtonProps

  var body: some View {
    if let label = props.label {
      if let systemImage = props.systemImage {
        SwiftUI.Button(label, systemImage: systemImage, role: props.role?.toNativeRole()) {
          props.onButtonPress()
        }
      } else {
        SwiftUI.Button(label, role: props.role?.toNativeRole()) {
          props.onButtonPress()
        }
      }
    } else {
      SwiftUI.Button(role: props.role?.toNativeRole()) {
        props.onButtonPress()
      } label: {
        Children()
      }
    }
  }
}
