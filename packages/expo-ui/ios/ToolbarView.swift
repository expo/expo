// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ToolbarViewProps: UIBaseViewProps {}

private struct ToolbarContentView: View {
  @ObservedObject var props: SlotViewProps
  let content: SlotView
  let base: AnyView

  @ViewBuilder
  var body: some View {
    let children = props.children ?? []

    if children.contains(where: isItem) {
      children.reduce(base) { view, child in
        let childView: any View = child.childView

        guard let slot = child.childView as? SlotView, slot.props.name == "item" else {
          return AnyView(placed(AnyView(childView), on: view, placement: .automatic, visibilityPriority: nil))
        }
        return AnyView(ToolbarItemLayer(props: slot.props, base: view, content: AnyView(childView)))
      }
    } else {
      base.toolbar {
        content
      }
    }
  }
}

private struct ToolbarItemLayer: View {
  @ObservedObject var props: SlotViewProps
  let base: AnyView
  let content: AnyView

  var body: some View {
    placed(content, on: base, placement: placement(from: props), visibilityPriority: visibilityPriority(from: props))
  }
}

internal struct ToolbarView: ExpoSwiftUI.View {
  @ObservedObject var props: ToolbarViewProps

  init(props: ToolbarViewProps) {
    self.props = props
  }

  var body: some View {
    if let content = props.children?.slot("content") {
      ToolbarContentView(props: content.props, content: content, base: AnyView(baseContent))
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

@ViewBuilder
private func placed(
  _ content: AnyView,
  on base: AnyView,
  placement: ToolbarItemPlacement,
  visibilityPriority: ToolbarItemVisibilityPriorityOptions?
) -> some View {
#if compiler(>=6.4) // Xcode 27
  if #available(iOS 27.0, macOS 26.1, tvOS 27.0, visionOS 27.0, *),
    let visibilityPriority {
    base.toolbar {
      ToolbarItem(placement: placement) {
        content
      }
      .visibilityPriority(visibilityPriority.toPriority())
    }
  } else {
    base.toolbar {
      ToolbarItem(placement: placement) {
        content
      }
    }
  }
#else
  base.toolbar {
    ToolbarItem(placement: placement) {
      content
    }
  }
#endif
}

private func isItem(_ child: any ExpoSwiftUI.AnyChild) -> Bool {
  return (child.childView as? SlotView)?.props.name == "item"
}

private func placement(from props: SlotViewProps) -> ToolbarItemPlacement {
  guard let rawPlacement = props.extraProps?["placement"] as? String,
    let placement = ToolbarItemPlacementOptions(rawValue: rawPlacement) else {
    return .automatic
  }
  return placement.toPlacement()
}

private func visibilityPriority(from props: SlotViewProps) -> ToolbarItemVisibilityPriorityOptions? {
  guard let rawPriority = props.extraProps?["visibilityPriority"] as? String else {
    return nil
  }
  return ToolbarItemVisibilityPriorityOptions(rawValue: rawPriority)
}
