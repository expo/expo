// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// A named slot. `SlotView` conforms in-app; `WidgetsDynamicView` conforms in the widgets renderer,
// so the `content` slot resolves whether children are real slots or widget wrappers.
public protocol AnySlotChild {
  var slotName: String? { get }
}

extension SlotView: AnySlotChild {
  var slotName: String? { props.name }
}

extension [any ExpoSwiftUI.AnyChild] {
  fileprivate func slotChild(_ name: String) -> (any ExpoSwiftUI.AnyChild)? {
    first { ($0.childView as? AnySlotChild)?.slotName == name }
  }

  fileprivate func withoutSlotChildren() -> [any ExpoSwiftUI.AnyChild] {
    filter { ($0.childView as? AnySlotChild)?.slotName == nil }
  }
}

public final class BackgroundViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

// `public` (unlike `Overlay` / `Mask`) so the widgets renderer can render it in Live Activities.
public struct BackgroundView: ExpoSwiftUI.View {
  @ObservedObject public var props: BackgroundViewProps

  public init(props: BackgroundViewProps) {
    self.props = props
  }

  public var body: some View {
    baseContent
      .background(alignment: props.alignment?.toAlignment() ?? .center) {
        backgroundContent
      }
  }

  @ViewBuilder
  private var baseContent: some View {
    ForEach(props.children?.withoutSlotChildren() ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  @ViewBuilder
  private var backgroundContent: some View {
    if let content = props.children?.slotChild("content") {
      let view: any View = content.childView
      AnyView(view)
    }
  }
}
