// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LazyListProps: UIBaseViewProps {
  @Field var itemKeys: [String] = []
  @Field var estimatedItemSize: Double = 44
  var onItemAppear = EventDispatcher()
  var onItemAppearSync = EventDispatcher(synchronous: true)
  var onItemDisappear = EventDispatcher()
  var onSelectItem = EventDispatcher()
  var onDeleteItems = EventDispatcher()
}

struct LazyListView: ExpoSwiftUI.View {
  @ObservedObject var props: LazyListProps

  init(props: LazyListProps) {
    self.props = props
  }

  var body: some View {
    List {
      ForEach(props.itemKeys, id: \.self) { key in
        LazyListRow(
          content: props.children?.slot(key),
          estimatedHeight: props.estimatedItemSize,
          onRealize: { dispatchAppear(key) },
          onDerealize: { props.onItemDisappear(["key": key]) }
        )
        .listRowInsets(EdgeInsets())
        .listRowSeparator(.hidden)
      }
      .onDelete { offsets in
        props.onDeleteItems(["indices": Array(offsets)])
      }
    }
    .listStyle(.plain)
  }

  private func dispatchAppear(_ key: String) {
    props.onItemAppearSync(["key": key])
  }
}

private struct LazyListRow: View {
  let content: SlotView?
  let estimatedHeight: Double
  let onRealize: () -> Void
  let onDerealize: () -> Void

  var body: some View {
    ZStack(alignment: .top) {
      if let content {
        content
      } else {
        Color.clear.frame(height: estimatedHeight)
      }
    }
    .background(RealizeProbe(onRealize: onRealize, onDerealize: onDerealize).frame(width: 0, height: 0))
  }
}

private struct RealizeProbe: UIViewRepresentable {
  let onRealize: () -> Void
  let onDerealize: () -> Void

  func makeUIView(context: Context) -> UIView {
    onRealize()
    return UIView()
  }

  func updateUIView(_ uiView: UIView, context: Context) {}

  static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
    coordinator.onDerealize()
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(onDerealize: onDerealize)
  }

  final class Coordinator {
    let onDerealize: () -> Void
    init(onDerealize: @escaping () -> Void) {
      self.onDerealize = onDerealize
    }
  }
}
