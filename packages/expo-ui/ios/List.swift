// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListProps: UIBaseViewProps {
  @Field var moveEnabled: Bool = false
  @Field var deleteEnabled: Bool = false
  @Field var selectEnabled: Bool = true
  @Field var editModeEnabled: Bool = false
  var onDeleteItem = EventDispatcher()
  var onMoveItem = EventDispatcher()
  var onSelectionChange = EventDispatcher()
}

struct ListView: ExpoSwiftUI.View {
  @ObservedObject var props: ListProps
  @State private var selection: Set<Int> = []
  @State var editModeEnabled: EditMode = .inactive

  init(props: ListProps) {
    self.props = props
  }

  var body: some View {
    List(selection: props.selectEnabled ? $selection : nil) {
      Children()
        .onDelete(perform: handleDelete)
        .onMove(perform: handleMove)
        .deleteDisabled(!props.deleteEnabled)
        .moveDisabled(!props.moveEnabled)
    }
    .onAppear {
      editModeEnabled = props.editModeEnabled ? .active : .inactive
    }
    .onChange(of: props.editModeEnabled) { newValue in
      withAnimation {
        editModeEnabled = newValue ? .active : .inactive
      }
    }
    .onChange(of: selection) { selection in
      handleSelectionChange(selection: selection)
    }
    .environment(\.editMode, $editModeEnabled)
  }
  func handleDelete(at offsets: IndexSet) {
    for offset in offsets {
      props.onDeleteItem([
        "index": offset
      ])
      selection.remove(offset)
    }
  }
  func handleMove(from sources: IndexSet, to destination: Int) {
    for source in sources {
      props.onMoveItem([
        "from": source,
        "to": destination
      ])
    }
  }
  func handleSelectionChange(selection: Set<Int>) {
    let selectionArray = Array(selection)
    let jsonDict: [String: Any] = [
      "selection": selectionArray
    ]
    props.onSelectionChange(jsonDict)
  }
}
