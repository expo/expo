// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListForEachProps: UIBaseViewProps {
  @Field var rowKeys: [String]?
  @Field var estimatedRowHeight: Double = 64
  @Field var dataVersion: Int = 0
  @Field var deleteEnabled: Bool = false
  @Field var moveEnabled: Bool = false
  var onRequestItem = EventDispatcher()
  var onRenderWindowChange = EventDispatcher()
  var onDelete = EventDispatcher()
  var onMove = EventDispatcher()
}

struct ListForEachView: ExpoSwiftUI.View {
  @ObservedObject var props: ListForEachProps

  @StateObject private var renderWindow = ListRenderWindow()

  @ViewBuilder
  var body: some View {
    if props.rowKeys != nil {
      rows
        .onChange(of: props.dataVersion) { _ in renderWindow.updateKeys(props) }
    } else {
      Children()
        .onDelete(perform: props.deleteEnabled ? handleDelete : nil)
        .onMove(perform: props.moveEnabled ? handleMove : nil)
    }
  }

  @ViewBuilder
  private var rows: some View {
    if let rowKeys = props.rowKeys {
      let content = mountedContent
      let dataVersion = props.dataVersion
      ForEach(rowKeys, id: \.self) { key in
        ListRenderRow(rowKey: key, content: content[key], props: props, renderWindow: renderWindow)
      }
      // Attach editing to all row keys, never to the sparse mounted React children.
      .onDelete(perform: props.deleteEnabled ? { offsets in
        props.onDelete(["indices": Array(offsets), "dataVersion": dataVersion])
      } : nil)
      .onMove(perform: props.moveEnabled ? { sources, destination in
        props.onMove([
          "sourceIndices": Array(sources), "destination": destination, "dataVersion": dataVersion
        ])
      } : nil)
    } else {
      Children()
    }
  }

  // React supplies only requested rows. Associate those sparse children with native row keys.
  private var mountedContent: [String: AnyView] {
    var result: [String: AnyView] = [:]
    for child in props.children ?? [] {
      if let wrapper = child as? any ExpoSwiftUI.ViewWrapper,
        let row = wrapper.getWrappedView() as? ListItemView {
        let view: any SwiftUI.View = child.childView
        result[row.props.rowKey] = AnyView(view)
      }
    }
    return result
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

private struct ListRenderRow: View {
  let rowKey: String
  let content: AnyView?
  let props: ListForEachProps
  let renderWindow: ListRenderWindow

  // A disappearing row can briefly report zero width. Its geometry must not
  // invalidate the other rows or overwrite their cached measurements.
  @State private var rowWidth: CGFloat = 0

  var body: some View {
    ZStack(alignment: .leading) {
      if let content {
        content
          .onGeometryChange(for: CGSize.self) {
            CGSize(width: rowWidth, height: $0.size.height)
          } action: { size in
            renderWindow.measure(rowKey, size: size)
          }
      } else {
        Color.clear
          .frame(height: renderWindow.height(rowKey, width: rowWidth) ?? props.estimatedRowHeight)
          .accessibilityHidden(true)
      }
    }
    .onAppear {
      renderWindow.updateKeys(props)
      renderWindow.appear(rowKey, ready: content != nil, props: props)
    }
    .onDisappear { renderWindow.disappear(rowKey, props: props) }
    .onChange(of: content != nil) { ready in
      // An older React commit may remove content after this row has appeared again.
      if !ready { renderWindow.requestMissing(rowKey, props: props) }
    }
    .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width in
      if width.isFinite && width > 0 { rowWidth = width }
    }
  }
}

// Internal key carrier; not a separate surface, renderer, or native row template.
final class ListItemProps: UIBaseViewProps {
  @Field var rowKey: String = ""
}

struct ListItemView: ExpoSwiftUI.View {
  @ObservedObject var props: ListItemProps

  var body: some View { Children() }
}
