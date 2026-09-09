// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class SlotViewProps: ExpoSwiftUI.ViewProps {
  @Field var name: String = ""
  @Field var extraProps: [String: Any]?
}

public struct SlotView: ExpoSwiftUI.View {
  @ObservedObject public var props: SlotViewProps

  public init(props: SlotViewProps) {
    self.props = props
  }

  public var body: some View {
    Children()
  }

  func extra<T>(_ key: String, as type: T.Type = T.self) -> T? {
    return props.extraProps?[key] as? T
  }
}

extension [any ExpoSwiftUI.AnyChild] {
  func slot(_ name: String) -> SlotView? {
    compactMap { $0.childView as? SlotView }
      .first { $0.props.name == name }
  }

  func withoutSlot(_ name: String) -> [any ExpoSwiftUI.AnyChild] {
    filter {
      guard let slot = $0.childView as? SlotView else { return true }
      return slot.props.name != name
    }
  }

  func withoutSlots() -> [any ExpoSwiftUI.AnyChild] {
    filter { !($0.childView is SlotView) }
  }
}
