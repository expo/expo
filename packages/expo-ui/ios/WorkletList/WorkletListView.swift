// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Props

final class WorkletListViewProps: UIBaseViewProps {
  /// Array of data items. Each item is a JSON-serializable dictionary.
  @Field var data: [[String: Any]] = []

  /// JavaScript source for the render function. Gets eval'd into the UI runtime.
  /// The function should take (item, index) and return a createElement descriptor tree.
  @Field var renderItemSource: String = ""
}

// MARK: - View

struct WorkletListView: ExpoSwiftUI.View {
  @ObservedObject var props: WorkletListViewProps

  /// Whether the JS runtime is bootstrapped and render function is registered.
  @State private var isReady = false

  /// Cache of rendered descriptors keyed by item index.
  /// Avoids re-calling eval() for items that have already been rendered.
  @State private var descriptorCache: [Int: [String: Any]] = [:]

  init(props: WorkletListViewProps) {
    self.props = props
  }

  var body: some View {
    // Use ScrollView + LazyVStack instead of List to ensure truly lazy rendering.
    // List inside an ExpoSwiftUI view wrapper doesn't get proper lazy behavior
    // because the hosting view may not constrain the List's visible area correctly.
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 0) {
        ForEach(0..<props.data.count, id: \.self) { index in
          itemView(index: index)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
          Divider()
        }
      }
    }
    .onAppear {
      bootstrap()
    }
  }

  // MARK: - Item Rendering

  @ViewBuilder
  private func itemView(index: Int) -> some View {
    if let descriptor = getCachedOrRender(index: index) {
      DynamicView(descriptor: descriptor)
    } else {
      Text("...")
        .foregroundColor(.secondary)
    }
  }

  /// Returns a cached descriptor or renders a new one.
  private func getCachedOrRender(index: Int) -> [String: Any]? {
    // Check cache first
    if let cached = descriptorCache[index] {
      return cached
    }

    // Render and cache
    guard index < props.data.count else { return nil }
    let item = props.data[index]
    print("[WorkletList] Rendering item \(index)")
    if let descriptor = renderItemSynchronously(item: item, index: index) {
      // Cache on next run loop to avoid mutating state during body
      DispatchQueue.main.async {
        descriptorCache[index] = descriptor
      }
      return descriptor
    }
    return nil
  }

  /// Calls the renderItem function synchronously on the UI runtime.
  private func renderItemSynchronously(item: [String: Any], index: Int) -> [String: Any]? {
    guard isReady else { return nil }
    guard let appContext = props.appContext else { return nil }

    do {
      let uiRuntime = try appContext.uiRuntime

      // Set the current item and index on the global scope.
      uiRuntime.global().setProperty("__wl_item", value: item as NSDictionary)
      uiRuntime.global().setProperty("__wl_index", value: index)

      // Call the bridge's renderItem synchronously.
      let result = try uiRuntime.eval("__workletListBridge.renderItem(__wl_item, __wl_index)")

      if result.isObject() {
        return result.getDictionary()
      }
      return nil
    } catch {
      print("[WorkletList] renderItem error at index \(index): \(error)")
      return nil
    }
  }

  // MARK: - Bootstrap

  /// Bootstrap the JS runtime and register the render function.
  private func bootstrap() {
    guard !isReady else { return }
    guard !props.renderItemSource.isEmpty else {
      print("[WorkletList] renderItemSource is empty")
      return
    }
    guard let appContext = props.appContext else {
      print("[WorkletList] No app context available")
      return
    }

    do {
      let uiRuntime = try appContext.uiRuntime

      // Check if runtime already initialized (another WorkletList may have done it)
      let bridge = uiRuntime.global().getProperty("__workletListBridge")
      if !bridge.isObject() {
        try uiRuntime.eval(workletListRuntimeSource)
      }

      // Register the render function by eval'ing the source string
      try uiRuntime.eval("__workletListBridge.__renderFn = \(props.renderItemSource)")

      // Verify
      let hasFn = try uiRuntime.eval("typeof __workletListBridge.__renderFn === 'function'")
      if hasFn.isBool() && hasFn.getBool() {
        isReady = true
      } else {
        print("[WorkletList] renderItemSource did not produce a function")
      }
    } catch {
      print("[WorkletList] Failed to bootstrap: \(error)")
    }
  }
}
