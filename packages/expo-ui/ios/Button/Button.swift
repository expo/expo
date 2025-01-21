// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct Button: ExpoSwiftUI.View {
  @EnvironmentObject var props: ButtonProps

  var body: some View {
    SwiftUI.Button(role: props.buttonRole?.toNativeRole(), action: { props.onButtonPressed() }, label: {
      if let systemImage = props.systemImage {
        Label(props.text, systemImage: systemImage)
      } else {
        Text(props.text)
      }
    })
    // TODO: Maybe there is a way to do a switch statement similarly to the `if` extension?
    .if(props.buttonStyle == .bordered, {
      $0.buttonStyle(.bordered)
    })
    .if(props.buttonStyle == .plain, {
      $0.buttonStyle(.plain)
    })
    .if(props.buttonStyle == .borderedProminent, {
      $0.buttonStyle(.borderedProminent)
    })
    .if(props.buttonStyle == .borderless, {
      $0.buttonStyle(.borderless)
    })

#if os(macOS)
    .if(props.buttonStyle == .accessoryBar, {
      $0.buttonStyle(.accessoryBar)
    })
    .if(props.buttonStyle == .accessoryBarAction, {
      $0.buttonStyle(.accessoryBarAction)
    })
    .if(props.buttonStyle == .card, {
      $0.buttonStyle(.card)
    })
    .if(props.buttonStyle == .link, {
      $0.buttonStyle(.link)
    })
#endif
  }
}

extension View {
  @ViewBuilder
  func `if`<Transform: View>(
    _ condition: Bool,
    transform: (Self) -> Transform
  ) -> some View {
    if condition {
      transform(self)
    } else {
      self
    }
  }
}
