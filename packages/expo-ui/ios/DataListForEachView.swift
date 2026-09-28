// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class DataListForEachProps: UIBaseViewProps {
  @Field var itemKeys: [String] = []
  @Field var revision: Int = 0
  @Field var estimatedItemSize: Double = 64
  @Field var deleteEnabled: Bool = false
  @Field var moveEnabled: Bool = false
  var onDelete = EventDispatcher()
  var onMove = EventDispatcher()
  var onWindowChange = EventDispatcher()
}

final class DataListForEachItemProps: ExpoSwiftUI.ViewProps {
  @Field var itemKey: String = ""
  @Field var index: Int = 0
  @Field var revision: Int = 0
}

struct DataListForEachItemView: ExpoSwiftUI.View {
  @ObservedObject var props: DataListForEachItemProps

  init(props: DataListForEachItemProps) {
    self.props = props
  }

  var body: some View {
    Children()
  }
}

final class DataListForEachPoolProps: ExpoSwiftUI.ViewProps {}

// Holds the recycled slots, so mounting a slot never republishes the list's own props.
struct DataListForEachPoolView: ExpoSwiftUI.View {
  @ObservedObject var props: DataListForEachPoolProps

  init(props: DataListForEachPoolProps) {
    self.props = props
  }

  var body: some View {
    EmptyView()
  }
}

struct DataListForEachView: ExpoSwiftUI.View {
  @ObservedObject var props: DataListForEachProps
  @StateObject private var window = DataListForEachWindow()

  init(props: DataListForEachProps) {
    self.props = props
  }

  var body: some View {
    let revision = props.revision
    let pool = (props.children ?? []).lazy.compactMap { ($0.childView as? DataListForEachPoolView)?.props }.first
    if let pool {
      ForEach(Array(props.itemKeys.enumerated()), id: \.element) { index, key in
        DataListForEachRow(itemKey: key, index: index, listProps: props, poolProps: pool, window: window)
          .tag(AnyHashable(key))
      }
      .onDelete(perform: props.deleteEnabled ? { offsets in
        props.onDelete(["indices": Array(offsets), "revision": revision])
      } : nil)
      .onMove(perform: props.moveEnabled ? { sources, destination in
        props.onMove(["sourceIndices": Array(sources), "destination": destination, "revision": revision])
      } : nil)
    }
  }
}

private struct DataListForEachRow: View {
  let itemKey: String
  let index: Int
  @ObservedObject var listProps: DataListForEachProps
  @ObservedObject var poolProps: DataListForEachPoolProps
  let window: DataListForEachWindow
  @State private var appeared = false
  @State private var visibilityID = UUID()

  // Slots are the pool's children; JS assigns item `index` to slot `index % count`.
  // Reading them here, not in the parent, keeps the row current when the slot count changes.
  private var slot: DataListForEachItemView? {
    guard let slots = poolProps.children, !slots.isEmpty else {
      return nil
    }
    return slots[index % slots.count].childView as? DataListForEachItemView
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if let slot {
        DataListForEachSlotContent(
          props: slot.props,
          itemKey: itemKey,
          index: index,
          revision: listProps.revision,
          estimatedHeight: CGFloat(listProps.estimatedItemSize),
          window: window
        )
      } else {
        Color.clear
          .frame(height: window.height(for: itemKey, fallback: listProps.estimatedItemSize))
          .accessibilityHidden(true)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .onAppear {
      appeared = true
      window.appear(itemKey, index: index, token: visibilityID, props: listProps)
    }
    .onChange(of: listProps.revision) { _ in
      window.reset(listProps)
      if appeared { window.appear(itemKey, index: index, token: visibilityID, props: listProps) }
    }
    .onGeometryChange(for: CGFloat.self, of: { $0.size.width }, action: { width in
      window.updateWidth(width)
    })
    .onDisappear {
      appeared = false
      window.disappear(itemKey, token: visibilityID)
    }
  }
}

private struct DataListForEachSlotContent: View {
  @ObservedObject var props: DataListForEachItemProps
  let itemKey: String
  let index: Int
  let revision: Int
  let estimatedHeight: CGFloat
  let window: DataListForEachWindow
  // we use this state so swiftui re-layouts when the slot is reused for a different item
  @State private var showsContent = false

  private var matches: Bool {
    props.itemKey == itemKey && props.index == index && props.revision == revision
  }

  var body: some View {
    Group {
      if showsContent {
        DataListForEachItemView(props: props)
          .id(itemKey)
          .onGeometryChange(for: CGFloat.self, of: { $0.size.height }, action: { height in
            window.measure(height, for: itemKey, revision: revision)
          })
      } else {
        // Hide the previous item while JS updates this slot.
        Color.clear
          .frame(height: window.height(for: itemKey, fallback: Double(estimatedHeight)))
          .accessibilityHidden(true)
      }
    }
    .onAppear { showsContent = matches }
    .onChange(of: matches) { showsContent = $0 }
  }
}

// Tracks rows without triggering view updates and batches window requests to JS.
private final class DataListForEachWindow: ObservableObject {
  private weak var props: DataListForEachProps?
  private var appeared: [String: Int] = [:]
  private var visibilityTokens: [String: UUID] = [:]
  private var heights: [String: CGFloat] = [:]
  private var width: CGFloat = 0
  private var revision = -1
  private var pending: DispatchWorkItem?
  private var lastSent: [Int] = []

  deinit {
    pending?.cancel()
  }

  func reset(_ props: DataListForEachProps) {
    self.props = props
    guard revision != props.revision else {
      return
    }
    revision = props.revision
    heights.removeAll()
    let positions = Dictionary(uniqueKeysWithValues: props.itemKeys.enumerated().map { ($0.element, $0.offset) })
    appeared = positions.filter { appeared[$0.key] != nil }
    visibilityTokens = visibilityTokens.filter { positions[$0.key] != nil }
    lastSent = []
    schedule()
  }

  func updateWidth(_ newWidth: CGFloat) {
    if width != newWidth {
      if width > 0 {
        heights.removeAll()
      }
      width = newWidth
    }
  }

  func appear(_ key: String, index: Int, token: UUID, props: DataListForEachProps) {
    reset(props)
    guard props.itemKeys.indices.contains(index), props.itemKeys[index] == key else {
      return
    }
    appeared[key] = index
    visibilityTokens[key] = token
    schedule()
  }

  func disappear(_ key: String, token: UUID) {
    // Ignore callbacks from a row that has been replaced.
    guard visibilityTokens[key] == token else {
      return
    }
    appeared.removeValue(forKey: key)
    visibilityTokens.removeValue(forKey: key)
    if appeared.isEmpty { lastSent = [] }
    schedule()
  }

  func height(for key: String, fallback: Double) -> CGFloat {
    heights[key] ?? CGFloat(fallback)
  }

  func measure(_ height: CGFloat, for key: String, revision: Int) {
    guard revision == self.revision, height.isFinite, height > 0 else {
      return
    }
    heights[key] = height
  }

  private func schedule() {
    guard pending == nil else {
      return
    }
    let work = DispatchWorkItem { [weak self] in
      guard let self else { return }
      self.pending = nil
      guard let props = self.props,
        let first = self.appeared.values.min(), let last = self.appeared.values.max() else {
        return
      }
      let event = [first, last, self.revision]
      guard event != self.lastSent else {
        return
      }
      self.lastSent = event
      props.onWindowChange(["first": first, "last": last, "revision": self.revision])
    }
    pending = work
    DispatchQueue.main.async(execute: work)
  }
}
