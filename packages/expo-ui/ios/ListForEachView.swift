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
  @State private var viewportWidth: CGFloat = 0

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
        ZStack(alignment: .leading) {
          if let row = content[key] {
            row
              .onGeometryChange(for: CGSize.self) {
                CGSize(width: viewportWidth, height: $0.size.height)
              } action: { size in
                renderWindow.measure(key, size: size)
              }
          } else {
            // Only the placeholder has an estimated height. Real content uses SwiftUI layout.
            Color.clear
              .frame(height: renderWindow.height(key, width: viewportWidth) ?? props.estimatedRowHeight)
              .accessibilityHidden(true)
          }
        }
        .onAppear {
          renderWindow.updateKeys(props)
          renderWindow.appear(key, ready: content[key] != nil, props: props)
        }
        .onDisappear { renderWindow.disappear(key, props: props) }
        .onChange(of: content[key] != nil) { ready in
          // An older React commit may remove content after this row has appeared again.
          if !ready { renderWindow.requestMissing(key, props: props) }
        }
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width in
          viewportWidth = width
        }
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

// Internal key carrier; not a separate surface, renderer, or native row template.
final class ListItemProps: UIBaseViewProps {
  @Field var rowKey: String = ""
}

struct ListItemView: ExpoSwiftUI.View {
  @ObservedObject var props: ListItemProps

  var body: some View { Children() }
}

/// Tracks SwiftUI lifecycle, not pixel-accurate viewability. No React work runs in this object.
private final class ListRenderWindow: ObservableObject {
  private var appeared = Set<String>()
  private var measurements: [String: CGSize] = [:]
  private var dataVersion: Int?
  private var revision = 0
  private var scheduled = false

  func measure(_ key: String, size: CGSize) {
    if size.height.isFinite && size.height > 0 {
      measurements[key] = size
    }
  }

  func height(_ key: String, width: CGFloat) -> CGFloat? {
    guard let size = measurements[key], size.width == width else { return nil }
    return size.height
  }

  func updateKeys(_ props: ListForEachProps) {
    guard dataVersion != props.dataVersion, let keys = props.rowKeys else { return }
    dataVersion = props.dataVersion
    let valid = Set(keys)
    appeared.formIntersection(valid)
    measurements = measurements.filter { valid.contains($0.key) }
    schedule(props)
  }

  func appear(_ key: String, ready: Bool, props: ListForEachProps) {
    appeared.insert(key)
    if !ready { requestMissing(key, props: props) }
    schedule(props)
  }

  func disappear(_ key: String, props: ListForEachProps) {
    appeared.remove(key)
    schedule(props)
  }

  func requestMissing(_ key: String, props: ListForEachProps) {
    guard appeared.contains(key) else { return }
    revision += 1
    props.onRequestItem.experimentalRequestSynchronous([
      "key": key, "keys": Array(appeared), "revision": revision, "dataVersion": props.dataVersion
    ])
    schedule(props)
  }

  private func schedule(_ props: ListForEachProps) {
    guard !scheduled else { return }
    scheduled = true
    // Coalesce a group of appearance/disappearance callbacks into one ordinary event.
    DispatchQueue.main.async { [weak self, weak props] in
      guard let self else { return }
      self.scheduled = false
      guard let props else { return }
      self.revision += 1
      props.onRenderWindowChange([
        "keys": Array(self.appeared), "revision": self.revision, "dataVersion": props.dataVersion
      ])
    }
  }
}
