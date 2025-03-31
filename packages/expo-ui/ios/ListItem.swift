// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal class SwipeAction: Record, Identifiable {
  required init() { }
  @Field var id: String
  @Field var props: ButtonProps
}

class ListItemViewProps: ExpoSwiftUI.ViewProps {
  @Field var leadingActions: [SwipeAction]
  @Field var allowsFullSwipeLeading = true

  @Field var trailingActions: [SwipeAction]
  @Field var allowsFullSwipeTrailing = true
  @Field var hideTrailingActionsInEditMode = true

  var onActionPressed = EventDispatcher()
}

struct ActionButtons: View {
  let fromArray: [SwipeAction]?
  let handleButtonPress: (_ id: String) -> Void

  var body: some View {
    ForEach(fromArray ?? []) { elem in
      elem.props.onButtonPressed.onEventSent = { _ in
        handleButtonPress(elem.id)
      }

      return ExpoUI.Button().environmentObject(elem.props)
    }
  }
}

struct ListItemView: ExpoSwiftUI.View {
  @Environment(\.editMode) private var editMode
  @EnvironmentObject var props: ListItemViewProps

  var body: some View {
    UnwrappedChildren { child, isHostingView in
      child
        .if(!isHostingView) {
          $0
            .offset(
              x: UIDevice.current.userInterfaceIdiom == .pad
              ? IPAD_OFFSET : IPHONE_OFFSET)
        }
    }
    .swipeActions(edge: .leading, allowsFullSwipe: props.allowsFullSwipeLeading) {
      ActionButtons(fromArray: props.leadingActions) { id in
        props.onActionPressed(["id": id])
      }
    }
    .swipeActions(edge: .trailing, allowsFullSwipe: props.allowsFullSwipeTrailing) {
      if editMode?.wrappedValue == .inactive || !props.hideTrailingActionsInEditMode {
        ActionButtons(fromArray: props.trailingActions) { id in
          props.onActionPressed(["id": id])
        }
      }
    }
  }
}
