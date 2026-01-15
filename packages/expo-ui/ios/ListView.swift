// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListProps: UIBaseViewProps {
  var onSelectionChange = EventDispatcher()
}

struct ListView: ExpoSwiftUI.View {
  @ObservedObject var props: ListProps
  @State private var selection = Set<AnyHashable>()

  init(props: ListProps) {
    self.props = props
  }

  var body: some View {
    List(selection: $selection) {
      Children()
    }
    .onChange(of: selection) { selection in
      handleSelectionChange(selection: selection)
    }
  }

  func handleSelectionChange(selection: Set<AnyHashable>) {
    let selectionArray = Array(selection)
    props.onSelectionChange(["selection": selectionArray])
  }
}
