// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct MenuView: ExpoSwiftUI.View {
  @ObservedObject var props: MenuProps

  var body: some View {
    if #available(iOS 14.0, tvOS 17.0, *) {
      let labelContent = props.children?
        .compactMap { $0.childView as? MenuLabel }
        .first

      if props.hasPrimaryAction {
        // With primaryAction, tap triggers callback and long-press shows menu
        if let systemImage = props.systemImage, let label = props.label {
          // primary action initializers require a LocalizedStringKey
          Menu(LocalizedStringKey(label), systemImage: systemImage) { Children() } primaryAction: { props.onPrimaryAction() }
        } else if let labelContent {
          Menu { Children() } label: { labelContent } primaryAction: { props.onPrimaryAction() }
        } else if let label = props.label {
          Menu(LocalizedStringKey(label)) { Children() } primaryAction: { props.onPrimaryAction() }
        }
      } else {
        // Without primaryAction, tap shows menu
        if let systemImage = props.systemImage, let label = props.label {
          Menu(label, systemImage: systemImage) { Children() }
        } else if let labelContent {
          Menu { Children() } label: { labelContent }
        } else if let label = props.label {
          Menu(label) { Children() }
        }
      }
    }
  }
}
