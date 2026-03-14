// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public struct Button: ExpoSwiftUI.View {
  @ObservedObject public var props: ButtonProps

  public init(props: ButtonProps) {
    self.props = props
  }

  public var body: some View {
    if let label = props.label {
      if let systemImage = props.systemImage {
        SwiftUI.Button(role: props.role?.toNativeRole(), action: {
          props.onButtonPress()
        }) {
          if UIImage(named: systemImage) != nil {
            Label(label, image: systemImage)
          } else {
            Label(label, systemImage: systemImage)
          }
        }
      } else {
        SwiftUI.Button(label, role: props.role?.toNativeRole()) {
          props.onButtonPress()
        }
      }
    } else {
      SwiftUI.Button(role: props.role?.toNativeRole(), action: {
        props.onButtonPress()
      }) {
        Children()
      }
    }
  }
}
