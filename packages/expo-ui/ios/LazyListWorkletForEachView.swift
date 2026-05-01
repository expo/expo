// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LazyListWorkletForEachProps: UIBaseViewProps {
  @Field var data: ObservableState?
  @Field var idKey: String = "id"
  @Field var renderItem: WorkletCallback?
  @Field var animated: Bool = true
}

/// Lazy list whose rows are produced by a worklet at SwiftUI cell-instantiation time.
/// Data lives in an `ObservableState`, so mutations from JS re-trigger SwiftUI's body
/// and `ForEach` diffs by stable id — add/remove/update/reorder animate correctly.
struct LazyListWorkletForEachView: ExpoSwiftUI.View {
  @ObservedObject var props: LazyListWorkletForEachProps

  init(props: LazyListWorkletForEachProps) {
    self.props = props
  }

  var body: some View {
    if let dataState = props.data {
      DataDrivenContent(
        state: dataState,
        idKey: props.idKey,
        renderItem: props.renderItem,
        animated: props.animated
      )
    }
  }
}

private struct DataDrivenContent: View {
  @ObservedObject var state: ObservableState
  let idKey: String
  let renderItem: WorkletCallback?
  let animated: Bool

  var body: some View {
    let entries = identifyItems(state.value as? [[String: Any]] ?? [], idKey: idKey)
    let ids = entries.map { $0.id }
    ForEach(entries) { entry in
      DescriptorView(descriptor: descriptor(for: entry))
    }
    .animation(animated ? .default : nil, value: ids)
  }

  private func descriptor(for entry: IdentifiedItem) -> [String: Any] {
    guard let renderItem else { return [:] }
    let result = renderItem.invokeReturning(arguments: [entry.item, entry.index])
    return (result as? [String: Any]) ?? [:]
  }
}

private struct IdentifiedItem: Identifiable {
  let id: AnyHashable
  let index: Int
  let item: [String: Any]
}

private func identifyItems(_ items: [[String: Any]], idKey: String) -> [IdentifiedItem] {
  items.enumerated().map { index, item in
    let id = hashableId(from: item[idKey], fallbackIndex: index)
    return IdentifiedItem(id: id, index: index, item: item)
  }
}

private func hashableId(from value: Any?, fallbackIndex: Int) -> AnyHashable {
  if let s = value as? String { return s }
  if let n = value as? Int { return n }
  if let n = value as? Double { return n }
  if let b = value as? Bool { return b }
  return "__idx_\(fallbackIndex)"
}
