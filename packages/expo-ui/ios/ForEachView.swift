// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ForEachProps: UIBaseViewProps {
  var onDelete = EventDispatcher()
  var onMove = EventDispatcher()
}

struct ForEachView: ExpoSwiftUI.View {
  @ObservedObject var props: ForEachProps

  init(props: ForEachProps) {
    self.props = props
  }

  var body: some View {
    Children()
      .onDelete(perform: handleDelete)
      .onMove(perform: handleMove)
  }

  func handleDelete(at offsets: IndexSet) {
    let indices = Array(offsets)
    props.onDelete(["indices": indices])
  }

  func handleMove(from sources: IndexSet, to destination: Int) {
    let sourceIndices = Array(sources)
    props.onMove(["sourceIndices": sourceIndices, "destination": destination])
  }
}
