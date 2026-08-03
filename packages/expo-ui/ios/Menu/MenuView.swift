// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal struct MenuView: ExpoSwiftUI.View {
  @ObservedObject var props: MenuProps

  // If label is a component, it is passed as a child, so we need to exclude it in order to display the menu content
  @ViewBuilder
  func ChildrenWithoutLabel() -> some View {
    ForEach(props.children?.withoutSlot("label") ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  var body: some View {
    Group {
      if #available(iOS 14.0, tvOS 17.0, *) {
        let labelContent = props.children?.slot("label")

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
    .plainMenuOnMacCatalyst()
  }
}

private extension View {
  /// Keeps the caller's `label` as the entire trigger on Mac Catalyst.
  ///
  /// Under the Mac idiom (`TARGETED_DEVICE_FAMILY` containing `6`, i.e. Xcode's
  /// "Optimize Interface for Mac"), SwiftUI resolves `Menu` to an AppKit-style
  /// pull-down: bordered chrome, a disclosure chevron, and its own intrinsic
  /// sizing. That visually replaces a custom `label` view and changes the
  /// trigger's measured size, so layouts built around the label break.
  ///
  /// `.menuStyle(.button)` with `.buttonStyle(.plain)` is the non-deprecated
  /// spelling of the old `.borderlessButton` menu style, and
  /// `.menuIndicator(.hidden)` removes the chevron. These are style modifiers,
  /// so applying them once to the enclosing `Group` propagates through the
  /// environment to whichever `Menu` branch renders.
  ///
  /// No-op off Mac Catalyst.
  @ViewBuilder
  func plainMenuOnMacCatalyst() -> some View {
#if targetEnvironment(macCatalyst)
    if #available(iOS 16.0, *) {
      self
        .menuStyle(.button)
        .buttonStyle(.plain)
        .menuIndicator(.hidden)
    } else {
      self
    }
#else
    self
#endif
  }
}
