// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListProps: UIBaseViewProps {
  @Field var editModeEnabled: Bool = false
  var onSelectionChange = EventDispatcher()
}

struct ListView: ExpoSwiftUI.View {
  @ObservedObject var props: ListProps
  @State private var selection = Set<AnyHashable>()
  @State var editModeEnabled: EditMode = .inactive

  init(props: ListProps) {
    self.props = props
  }

  var body: some View {
    List(selection: $selection) {
      Children()
    }
    .onAppear {
      editModeEnabled = props.editModeEnabled ? .active : .inactive
    }
    .onChange(of: props.editModeEnabled) { newValue in
      editModeEnabled = newValue ? .active : .inactive
    }
    .onChange(of: selection) { selection in
      handleSelectionChange(selection: selection)
    }
    .environment(\.editMode, $editModeEnabled)
  }

  func handleSelectionChange(selection: Set<AnyHashable>) {
    let selectionArray = Array(selection)
    props.onSelectionChange(["selection": selectionArray])
  }
}
