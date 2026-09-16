// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListForEachProps: UIBaseViewProps {
  @Field var deleteEnabled: Bool = false
  @Field var moveEnabled: Bool = false
  var onDelete = EventDispatcher()
  var onMove = EventDispatcher()
}

struct ListForEachView: ExpoSwiftUI.View {
  @ObservedObject var props: ListForEachProps

  init(props: ListForEachProps) {
    self.props = props
  }

  var body: some View {
    Children()
      .onDelete(perform: props.deleteEnabled ? handleDelete : nil)
      .onMove(perform: props.moveEnabled ? handleMove : nil)
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
