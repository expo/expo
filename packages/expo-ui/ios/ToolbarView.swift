// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ToolbarViewProps: UIBaseViewProps {}

/**
 A toolbar child resolved ahead of the builder, so nothing existential reaches
 `ToolbarContentBuilder`.
 */
private struct ResolvedToolbarItem {
  let content: AnyView
  let placement: ToolbarItemPlacement
  let visibilityPriority: ToolbarItemVisibilityPriorityOptions?
}

internal struct ToolbarView: ExpoSwiftUI.View {
  @ObservedObject var props: ToolbarViewProps

  init(props: ToolbarViewProps) {
    self.props = props
  }

  var body: some View {
    if let content = props.children?.slot("content") {
      toolbarContent(content)
    } else {
      baseContent
    }
  }

  @ViewBuilder
  private func toolbarContent(_ content: SlotView) -> some View {
    let children = content.props.children ?? []

    if children.contains(where: isItem) {
      // `ForEach` conforms to `ToolbarContent` but has no initializer taking a
      // `ToolbarContentBuilder`, unlike the `TabContent` one, so it cannot build toolbar items.
      // Each item gets its own `.toolbar` instead, leaving one literal item per builder.
      resolve(children).reduce(AnyView(baseContent)) { view, item in
        AnyView(placed(item, on: view))
      }
    } else {
      baseContent.toolbar {
        content
      }
    }
  }

  @ViewBuilder
  private func placed(_ item: ResolvedToolbarItem, on view: AnyView) -> some View {
#if compiler(>=6.4) // Xcode 27
    if #available(iOS 27.0, macOS 26.1, tvOS 27.0, visionOS 27.0, *),
      let priority = item.visibilityPriority {
      view.toolbar {
        ToolbarItem(placement: item.placement) {
          item.content
        }
        .visibilityPriority(priority.toPriority())
      }
    } else {
      view.toolbar {
        ToolbarItem(placement: item.placement) {
          item.content
        }
      }
    }
#else
    view.toolbar {
      ToolbarItem(placement: item.placement) {
        item.content
      }
    }
#endif
  }

  private func resolve(_ children: [any ExpoSwiftUI.AnyChild]) -> [ResolvedToolbarItem] {
    return children.map { child in
      let view: any View = child.childView
      let slot = child.childView as? SlotView

      return ResolvedToolbarItem(
        content: AnyView(view),
        placement: placement(from: slot),
        visibilityPriority: visibilityPriority(from: slot)
      )
    }
  }

  private func isItem(_ child: any ExpoSwiftUI.AnyChild) -> Bool {
    return (child.childView as? SlotView)?.props.name == "item"
  }

  private func placement(from slot: SlotView?) -> ToolbarItemPlacement {
    guard let rawPlacement = slot?.props.extraProps?["placement"] as? String,
      let placement = ToolbarItemPlacementOptions(rawValue: rawPlacement) else {
      return .automatic
    }
    return placement.toPlacement()
  }

  private func visibilityPriority(from slot: SlotView?) -> ToolbarItemVisibilityPriorityOptions? {
    guard let rawPriority = slot?.props.extraProps?["visibilityPriority"] as? String else {
      return nil
    }
    return ToolbarItemVisibilityPriorityOptions(rawValue: rawPriority)
  }

  @ViewBuilder
  private var baseContent: some View {
    ForEach(props.children?.withoutSlots() ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }
}
