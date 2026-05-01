// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SwipeActionsEdge: String, Enumerable {
  case leading
  case trailing

  func toNativeEdge() -> HorizontalEdge {
    switch self {
    case .leading:
      return .leading
    case .trailing:
      return .trailing
    }
  }
}

internal final class SwipeActionsViewProps: UIBaseViewProps {
}

private struct SwipeActionsSlot {
  let edge: SwipeActionsEdge
  let allowsFullSwipe: Bool
  let view: SlotView
}

internal struct SwipeActionsView: ExpoSwiftUI.View {
  @ObservedObject var props: SwipeActionsViewProps

  var body: some View {
    let child = props.children?.withoutSlots().first
#if os(tvOS)
    if let child {
      let view: any View = child.childView
      AnyView(view)
    }
#else
    if let child {
      let view: any View = child.childView
      contentWithSwipeActions(AnyView(view))
    }
#endif
  }

  @ViewBuilder
  private func contentWithSwipeActions(_ content: AnyView) -> some View {
    let leading = actionSlot(for: .leading)
    let trailing = actionSlot(for: .trailing)

    if let leading, let trailing {
      content
        .swipeActions(edge: .leading, allowsFullSwipe: leading.allowsFullSwipe) {
          leading.view
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: trailing.allowsFullSwipe) {
          trailing.view
        }
    } else if let leading {
      content
        .swipeActions(edge: .leading, allowsFullSwipe: leading.allowsFullSwipe) {
          leading.view
        }
    } else if let trailing {
      content
        .swipeActions(edge: .trailing, allowsFullSwipe: trailing.allowsFullSwipe) {
          trailing.view
        }
    } else {
      content
    }
  }

  private func actionSlot(for edge: SwipeActionsEdge) -> SwipeActionsSlot? {
    props.children?
      .compactMap { $0.childView as? SlotView }
      .compactMap(parseActionSlot)
      .first { $0.edge == edge }
  }

  private func parseActionSlot(_ slot: SlotView) -> SwipeActionsSlot? {
    guard slot.props.name == "actions",
          let edgeName = slot.extra("edge", as: String.self),
          let edge = SwipeActionsEdge(rawValue: edgeName) else {
      return nil
    }

    return SwipeActionsSlot(
      edge: edge,
      allowsFullSwipe: slot.extra("allowsFullSwipe", as: Bool.self) ?? true,
      view: slot
    )
  }
}
