// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

public final class OverlayViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

public struct OverlayView: ExpoSwiftUI.View {
  @ObservedObject public var props: OverlayViewProps

  public init(props: OverlayViewProps) {
    self.props = props
  }

  public var body: some View {
    baseContent
      .overlay(alignment: props.alignment?.toAlignment() ?? .center) {
        overlayContent
      }
  }

  @ViewBuilder
  private var baseContent: some View {
    ForEach(props.children?.withoutSlots() ?? [], id: \.childIdentity) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  @ViewBuilder
  private var overlayContent: some View {
    if let content = props.children?.slot("content") {
      content
    }
  }
}
