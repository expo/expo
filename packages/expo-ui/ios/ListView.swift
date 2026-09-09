// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListProps: UIBaseViewProps {
  @Field var selection: [Either<String, Double>]?
  var onSelectionChange = EventDispatcher()

  // Absent for the existing children-based List. Present for the lazy-data experiment.
  @Field var rowKeys: [String]?
  @Field var estimatedRowHeight: Double = 64
  @Field var dataVersion: Int = 0
  var onRequestItem = EventDispatcher()
  var onRenderWindowChange = EventDispatcher()
}

struct ListView: ExpoSwiftUI.View {
  @ObservedObject var props: ListProps
  @State private var selection = Set<AnyHashable>()
  @StateObject private var renderWindow = ListRenderWindow()
  @State private var viewportWidth: CGFloat = 0

  var body: some View {
    list
      .onAppear { renderWindow.updateKeys(props) }
      .onChange(of: props.dataVersion) { _ in renderWindow.updateKeys(props) }
      .onDisappear { renderWindow.clearAppeared(props) }
      .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width in
        if props.rowKeys != nil { viewportWidth = width }
      }
  }

  @ViewBuilder
  private var list: some View {
    if props.selection != nil {
      List(selection: $selection) {
        rows
      }
      .onAppear {
        selection = Self.getHashableSetFromEither(props.selection)
      }
      .onChange(of: props.selection) { newValue in
        selection = Self.getHashableSetFromEither(newValue)
      }
      .onChange(of: selection) { newSelection in
        handleSelectionChange(selection: newSelection)
      }
    } else {
      List {
        rows
      }
    }
  }

  @ViewBuilder
  private var rows: some View {
    if let rowKeys = props.rowKeys {
      let content = mountedContent
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
            Color.orange.opacity(0.25)
              .frame(height: renderWindow.height(key, width: viewportWidth) ?? props.estimatedRowHeight)
              .accessibilityIdentifier("list-missing-\(key)")
          }
        }
        .onAppear {
          renderWindow.appear(key, ready: content[key] != nil, props: props)
        }
        .onDisappear { renderWindow.disappear(key, props: props) }
        .onChange(of: content[key] != nil) { ready in
          // An older React commit may remove content after this row has appeared again.
          if !ready { renderWindow.requestMissing(key, props: props) }
        }
      }
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

  func handleSelectionChange(selection: Set<AnyHashable>) {
    let propsSelection = Self.getHashableSetFromEither(props.selection)
    if propsSelection == selection { return }

    let selectionArray: [Any] = selection.compactMap { value in
      if let stringValue = value as? String {
        return stringValue
      } else if let doubleValue = value as? Double {
        return doubleValue
      }
      return nil
    }
    props.onSelectionChange(["selection": selectionArray])
  }

  private static func getHashableSetFromEither(_ array: [Either<String, Double>]?) -> Set<AnyHashable> {
    guard let array else { return Set() }
    var result = Set<AnyHashable>()
    for item in array {
      if let stringValue: String = item.get() {
        result.insert(stringValue)
      } else if let doubleValue: Double = item.get() {
        result.insert(doubleValue)
      }
    }
    return result
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

  func updateKeys(_ props: ListProps) {
    guard let keys = props.rowKeys else { return }
    let valid = Set(keys)
    appeared.formIntersection(valid)
    measurements = measurements.filter { valid.contains($0.key) }
    schedule(props)
  }

  func appear(_ key: String, ready: Bool, props: ListProps) {
    appeared.insert(key)
    if !ready { requestMissing(key, props: props) }
    schedule(props)
  }

  func disappear(_ key: String, props: ListProps) {
    appeared.remove(key)
    schedule(props)
  }

  func clearAppeared(_ props: ListProps) {
    appeared.removeAll()
    if props.rowKeys != nil { schedule(props) }
  }

  func requestMissing(_ key: String, props: ListProps) {
    guard appeared.contains(key) else { return }
    revision += 1
    props.onRequestItem.experimentalRequestSynchronous([
      "key": key, "keys": Array(appeared), "revision": revision
    ])
    schedule(props)
  }

  private func schedule(_ props: ListProps) {
    guard !scheduled else { return }
    scheduled = true
    // Coalesce a group of appearance/disappearance callbacks into one ordinary event.
    DispatchQueue.main.async { [weak self, weak props] in
      guard let self else { return }
      self.scheduled = false
      guard let props else { return }
      self.revision += 1
      props.onRenderWindowChange(["keys": Array(self.appeared), "revision": self.revision])
    }
  }
}
