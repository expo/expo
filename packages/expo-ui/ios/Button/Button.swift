// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct Button: ExpoSwiftUI.View {
  @ObservedObject var props: ButtonProps

  var body: some View {
    let button = SwiftUI.Button(
      role: props.buttonRole?.toNativeRole(),
      action: {
        props.onButtonPressed()
      },
      label: {
        if let text = props.text {
          if let systemImage = props.systemImage {
            Label(text, systemImage: systemImage)
          } else {
            Text(text)
          }
        } else if let systemImage = props.systemImage {
          Image(systemName: systemImage)
        } else {
          Children()
        }
      })
    .disabled(props.disabled)
    .tint(props.color)
    .controlSize(props.controlSize?.toNativeControlSize() ?? .regular)
    .modifier(CommonViewModifiers(props: props))
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

    #if os(tvOS)
    .if(props.variant == .card, {
      $0.buttonStyle(.card)
    })
    #else
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

    if #available(iOS 26.0, tvOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      switch props.variant {
      case .glass:
        button.buttonStyle(.glass)
      case .glassProminent:
        button.buttonStyle(.glassProminent)
      default:
        button
      }
      #else
      button
      #endif
    } else {
      button
    }
  }
}

