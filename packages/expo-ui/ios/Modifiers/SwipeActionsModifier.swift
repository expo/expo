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

internal struct SwipeActionItem: Record {
  @Field var id: String = ""
  @Field var label: String?
  @Field var systemImage: String?
  @Field var role: ButtonRole = .default
  @Field var backgroundColor: Color?
}

internal struct SwipeActionsModifier: ViewModifier, Record {
  @Field var edge: SwipeActionsEdge = .trailing
  @Field var allowsFullSwipe: Bool = true
  @Field var actions: [SwipeActionItem] = []

  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  @ViewBuilder
  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if #available(iOS 15.0, *) {
      content.swipeActions(edge: edge.toNativeEdge(), allowsFullSwipe: allowsFullSwipe) {
        ForEach(actions, id: \.id) { action in
          makeButton(for: action)
        }
      }
    } else {
      content
    }
#endif
  }

  private func eventName() -> String {
    switch edge {
    case .leading:
      return "leadingSwipeActions"
    case .trailing:
      return "trailingSwipeActions"
    }
  }

  @ViewBuilder
  private func makeButton(for action: SwipeActionItem) -> some View {
    let button = Group {
      if let label = action.label, let systemImage = action.systemImage {
        SwiftUI.Button(role: action.role.toNativeRole()) {
          eventDispatcher?([eventName(): ["id": action.id]])
        } label: {
          Label(label, systemImage: systemImage)
        }
      } else if let systemImage = action.systemImage {
        SwiftUI.Button(role: action.role.toNativeRole()) {
          eventDispatcher?([eventName(): ["id": action.id]])
        } label: {
          Image(systemName: systemImage)
        }
      } else {
        SwiftUI.Button(role: action.role.toNativeRole()) {
          eventDispatcher?([eventName(): ["id": action.id]])
        } label: {
          Text(action.label ?? "")
        }
      }
    }

    if let backgroundColor = action.backgroundColor {
      button.tint(backgroundColor)
    } else {
      button
    }
  }
}
