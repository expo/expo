// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal struct MenuView: ExpoSwiftUI.View {
  @ObservedObject var props: MenuProps

  // If label is a component, it is passed as a child, so we need to exclude it in order to display the menu content
  @ViewBuilder
  func ChildrenWithoutLabel() -> some View {
    let labelView = props.children?.first(where: { $0.childView is MenuLabel })
    ForEach(props.children?.filter { $0.id != labelView?.id } ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  var body: some View {
    if #available(iOS 14.0, tvOS 17.0, *) {
      let labelContent = props.children?
        .compactMap { $0.childView as? MenuLabel }
        .first

      if props.hasPrimaryAction {
        // With primaryAction, tap triggers callback and long-press shows menu
        if let systemImage = props.systemImage, let label = props.label {
          Menu(LocalizedStringKey(label), systemImage: systemImage) { Children() } primaryAction: { props.onPrimaryAction() }
        } else if let labelContent {
          Menu { ChildrenWithoutLabel() } label: { labelContent } primaryAction: { props.onPrimaryAction() }
        } else if let label = props.label {
          Menu(LocalizedStringKey(label)) { Children() } primaryAction: { props.onPrimaryAction() }
        }
      } else {
        // Without primaryAction, tap shows menu
        if let systemImage = props.systemImage, let label = props.label {
          Menu(label, systemImage: systemImage) { Children() }
        } else if let labelContent {
          Menu { ChildrenWithoutLabel() } label: { labelContent }
        } else if let label = props.label {
          Menu(label) { Children() }
        }
      }
    }
  }
}
