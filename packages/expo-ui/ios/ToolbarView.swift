// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ToolbarViewProps: UIBaseViewProps {}

#if !os(tvOS)
internal enum ToolbarItemPlacementOptions: String, Enumerable {
  case automatic
  case principal
  case topBarLeading
  case topBarTrailing
  case bottomBar
  case navigation
  case primaryAction
  case secondaryAction
  case cancellationAction
  case confirmationAction
  case destructiveAction
  case status
  case keyboard

  var value: ToolbarItemPlacement {
    switch self {
    case .automatic: return .automatic
    case .principal: return .principal
    case .topBarLeading:
      if #available(iOS 17.0, *) {
        return .topBarLeading
      }
      return .navigationBarLeading
    case .topBarTrailing:
      if #available(iOS 17.0, *) {
        return .topBarTrailing
      }
      return .navigationBarTrailing
    case .bottomBar: return .bottomBar
    case .navigation: return .navigation
    case .primaryAction: return .primaryAction
    case .secondaryAction: return .secondaryAction
    case .cancellationAction: return .cancellationAction
    case .confirmationAction: return .confirmationAction
    case .destructiveAction: return .destructiveAction
    case .status: return .status
    case .keyboard: return .keyboard
    }
  }
}

internal struct ExpoToolbarContent: ToolbarContent {
  let content: SlotView

  @ToolbarContentBuilder
  var body: some ToolbarContent {
    PrimaryToolbarContent(content: content)
    SecondaryToolbarContent(content: content)
  }
}

private struct PrimaryToolbarContent: ToolbarContent {
  let content: SlotView

  @ToolbarContentBuilder
  var body: some ToolbarContent {
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.automatic.value) {
      toolbarItemViews(content, placement: .automatic)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.principal.value) {
      toolbarItemViews(content, placement: .principal)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.topBarLeading.value) {
      toolbarItemViews(content, placement: .topBarLeading)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.topBarTrailing.value) {
      toolbarItemViews(content, placement: .topBarTrailing)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.bottomBar.value) {
      toolbarItemViews(content, placement: .bottomBar)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.navigation.value) {
      toolbarItemViews(content, placement: .navigation)
    }
  }
}

private struct SecondaryToolbarContent: ToolbarContent {
  let content: SlotView

  @ToolbarContentBuilder
  var body: some ToolbarContent {
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.primaryAction.value) {
      toolbarItemViews(content, placement: .primaryAction)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.secondaryAction.value) {
      toolbarItemViews(content, placement: .secondaryAction)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.cancellationAction.value) {
      toolbarItemViews(content, placement: .cancellationAction)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.confirmationAction.value) {
      toolbarItemViews(content, placement: .confirmationAction)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.destructiveAction.value) {
      toolbarItemViews(content, placement: .destructiveAction)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.status.value) {
      toolbarItemViews(content, placement: .status)
    }
    ToolbarItemGroup(placement: ToolbarItemPlacementOptions.keyboard.value) {
      toolbarItemViews(content, placement: .keyboard)
    }
  }
}

@ViewBuilder
private func toolbarItemViews(
  _ content: SlotView,
  placement: ToolbarItemPlacementOptions
) -> some View {
  if placement == .automatic {
    ForEach(content.props.children?.withoutSlot("item") ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }
  ForEach(
    content.props.children?.slots("item", extra: "placement", equals: placement.rawValue) ?? [],
    id: \.id
  ) { child in
    let view: any View = child.childView
    AnyView(view)
  }
}
#endif

internal struct ToolbarView: ExpoSwiftUI.View {
  @ObservedObject var props: ToolbarViewProps

  init(props: ToolbarViewProps) {
    self.props = props
  }

  var body: some View {
    if let content = props.children?.slot("content") {
      baseContent
        .toolbar {
#if !os(tvOS)
          ExpoToolbarContent(content: content)
#else
          content
#endif
        }
    } else {
      baseContent
    }
  }

  @ViewBuilder
  private var baseContent: some View {
    ForEach(props.children?.withoutSlots() ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

}
