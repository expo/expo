// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI

/// Tracks SwiftUI lifecycle, not pixel-accurate viewability. No React work runs in this object.
final class ListRenderWindow: ObservableObject {
  private var appeared = Set<String>()
  private var measurements: [String: CGSize] = [:]
  private var dataVersion: Int?
  private var revision = 0
  private var scheduled = false

  func measure(_ key: String, size: CGSize) {
    if size.width.isFinite && size.width > 0 && size.height.isFinite && size.height > 0 {
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
