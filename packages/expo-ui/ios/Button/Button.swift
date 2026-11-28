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
        if isSystemSymbol(systemImage) {
          SwiftUI.Button(label, systemImage: systemImage, role: props.role?.toNativeRole()) {
            props.onButtonPress()
          }
        } else {
          // Not an SF Symbol, so a custom symbol or an image in the app's asset catalog.
          SwiftUI.Button(role: props.role?.toNativeRole()) {
            props.onButtonPress()
          } label: {
            Label(label, image: systemImage)
          }
        }
      } else {
        SwiftUI.Button(label, role: props.role?.toNativeRole()) {
          props.onButtonPress()
        }
      }
    } else {
      labelLessButton
    }
  }

  private func isSystemSymbol(_ name: String) -> Bool {
    #if os(macOS)
    return NSImage(systemSymbolName: name, accessibilityDescription: nil) != nil
    #else
    return UIImage(systemName: name) != nil
    #endif
  }

  @ViewBuilder
  private var labelLessButton: some View {
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *),
      props.children?.isEmpty ?? true,
      let role = props.role?.toNativeRole() {
      SwiftUI.Button(role: role) {
        props.onButtonPress()
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
