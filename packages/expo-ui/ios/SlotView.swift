// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class SlotViewProps: ExpoSwiftUI.ViewProps {
  @Field var name: String = ""
}

internal struct SlotView: ExpoSwiftUI.View {
  @ObservedObject var props: SlotViewProps

  init(props: SlotViewProps) {
    self.props = props
  }

  var body: some View {
    Children()
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
