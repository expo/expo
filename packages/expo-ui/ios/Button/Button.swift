// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct Button: ExpoSwiftUI.View {
  @EnvironmentObject var props: ButtonProps

  var body: some View {
    SwiftUI.Button(
      role: props.buttonRole?.toNativeRole(),
      action: {
        props.onButtonPressed()
      },
      label: {
        if let systemImage = props.systemImage {
          Label(props.text, systemImage: systemImage)
        } else {
          Text(props.text)
        }
      })
    .tint(props.color)
    // TODO: Maybe there is a way to do a switch statement similarly to the `if` extension?
    .if(props.variant == .bordered, {
      $0.buttonStyle(.bordered)
    })
    .if(props.variant == .plain, {
      $0.buttonStyle(.plain)
    })
    .if(props.variant == .borderedProminent, {
      $0.buttonStyle(.borderedProminent)
    })
    #if !os(tvOS)
    .if(props.variant == .borderless, {
      $0.buttonStyle(.borderless)
    })
    #endif

#if os(macOS)
    .if(props.variant == .accessoryBar, {
      $0.buttonStyle(.accessoryBar)
    })
    .if(props.variant == .accessoryBarAction, {
      $0.buttonStyle(.accessoryBarAction)
    })
    .if(props.variant == .card, {
      $0.buttonStyle(.card)
    })
    .if(props.variant == .link, {
      $0.buttonStyle(.link)
    })
#endif
  }
}
