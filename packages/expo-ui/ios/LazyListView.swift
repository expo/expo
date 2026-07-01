// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LazyListProps: UIBaseViewProps {
  @Field var count: Int = 0
  @Field var estimatedItemSize: Double = 44
  var onItemAppear = EventDispatcher()
  var onItemDisappear = EventDispatcher()
}

// A list that mounts its rows on demand instead of all at once. SwiftUI's List only builds the bodies
// of rows near the viewport (and recycles them, so memory stays bounded); each row reports when it
// appears and disappears, and JS reacts by mounting (or unmounting) the real child for that index and
// handing it back through the `slot(index)` lookup.
//
// Rows JS has not mounted yet render a fixed-height placeholder. This is essential: an empty row is
// zero-height, which collapses the whole content so every row lands in the viewport at once and the
// list stops virtualizing. The placeholder gives it a size to lay out and scroll against.
struct LazyListView: ExpoSwiftUI.View {
  @ObservedObject var props: LazyListProps

  init(props: LazyListProps) {
    self.props = props
  }

  var body: some View {
    List(0..<max(props.count, 0), id: \.self) { index in
      LazyListRow(
        content: props.children?.slot(String(index)),
        estimatedHeight: props.estimatedItemSize,
        onAppear: { props.onItemAppear(["index": index]) },
        onDisappear: { props.onItemDisappear(["index": index]) }
      )
      .listRowInsets(EdgeInsets())
      .listRowSeparator(.hidden)
    }
    .listStyle(.plain)
  }
}

// The ZStack is the row's stable identity, so `.onAppear`/`.onDisappear` fire once per scroll in/out.
// The content inside swaps from placeholder to the mounted child (and back) without re-firing them.
private struct LazyListRow: View {
  let content: SlotView?
  let estimatedHeight: Double
  let onAppear: () -> Void
  let onDisappear: () -> Void

  var body: some View {
    ZStack(alignment: .top) {
      if let content {
        content
      } else {
        Color.clear.frame(height: estimatedHeight)
      }
    }
    .onAppear(perform: onAppear)
    .onDisappear(perform: onDisappear)
  }
}
