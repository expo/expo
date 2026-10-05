// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// The axis the rows scroll along: vertical in `List` and `LazyVStack`, horizontal in `LazyHStack`.
enum DataListForEachAxis: String, Enumerable {
  case vertical
  case horizontal
}

private struct ContainerCrossAxisSizeKey: EnvironmentKey {
  static let defaultValue: CGFloat = 0
}

extension EnvironmentValues {
  // Set by `ListView`, `LazyVStackView` and `LazyHStackView`, so recycled rows reset their cached sizes when it changes.
  var containerCrossAxisSize: CGFloat {
    get { self[ContainerCrossAxisSizeKey.self] }
    set { self[ContainerCrossAxisSizeKey.self] = newValue }
  }
}

final class DataListForEachProps: UIBaseViewProps {
  @Field var axis: DataListForEachAxis = .vertical
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
  @Environment(\.containerCrossAxisSize) private var crossAxisSize
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
          estimatedSize: CGFloat(listProps.estimatedItemSize),
          axis: listProps.axis,
          window: window
        )
      } else {
        DataListForEachPlaceholder(
          size: window.size(for: itemKey, fallback: listProps.estimatedItemSize),
          axis: listProps.axis
        )
      }
    }
    .onAppear {
      appeared = true
      window.updateCrossAxisSize(crossAxisSize)
      window.appear(itemKey, index: index, token: visibilityID, props: listProps)
    }
    .onChange(of: crossAxisSize) { window.updateCrossAxisSize($0) }
    .onChange(of: listProps.revision) { _ in
      window.reset(listProps)
      if appeared { window.appear(itemKey, index: index, token: visibilityID, props: listProps) }
    }
    .onDisappear {
      appeared = false
      window.disappear(itemKey, token: visibilityID)
    }
  }
}

private struct DataListForEachPlaceholder: View {
  let size: CGFloat
  let axis: DataListForEachAxis

  // Sized along the scroll axis only, so it never stretches a lazy stack across it.
  var body: some View {
    Color.clear
      .frame(width: axis == .horizontal ? size : 0, height: axis == .horizontal ? 0 : size)
      .accessibilityHidden(true)
  }
}

private struct DataListForEachSlotContent: View {
  @ObservedObject var props: DataListForEachItemProps
  let itemKey: String
  let index: Int
  let revision: Int
  let estimatedSize: CGFloat
  let axis: DataListForEachAxis
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
          .onGeometryChange(
            for: CGFloat.self,
            of: { axis == .horizontal ? $0.size.width : $0.size.height },
            action: { size in window.measure(size, for: itemKey, revision: revision) }
          )
      } else {
        // Hide the previous item while JS updates this slot.
        DataListForEachPlaceholder(
          size: window.size(for: itemKey, fallback: Double(estimatedSize)),
          axis: axis
        )
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
  // Row sizes along the scroll axis.
  private var sizes: [String: CGFloat] = [:]
  private var crossAxisSize: CGFloat = 0
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
    sizes.removeAll()
    let positions = Dictionary(uniqueKeysWithValues: props.itemKeys.enumerated().map { ($0.element, $0.offset) })
    appeared = positions.filter { appeared[$0.key] != nil }
    visibilityTokens = visibilityTokens.filter { positions[$0.key] != nil }
    lastSent = []
    schedule()
  }

  func updateCrossAxisSize(_ newSize: CGFloat) {
    if crossAxisSize != newSize {
      if crossAxisSize > 0 {
        sizes.removeAll()
      }
      crossAxisSize = newSize
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

  func size(for key: String, fallback: Double) -> CGFloat {
    sizes[key] ?? CGFloat(fallback)
  }

  func measure(_ size: CGFloat, for key: String, revision: Int) {
    guard revision == self.revision, size.isFinite, size > 0 else {
      return
    }
    sizes[key] = size
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
