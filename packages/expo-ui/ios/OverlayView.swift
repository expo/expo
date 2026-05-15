// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal class OverlayViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

internal struct OverlayView: ExpoSwiftUI.View {
  @ObservedObject var props: OverlayViewProps

  var body: some View {
    baseContent
      .overlay(alignment: props.alignment?.toAlignment() ?? .center) {
        overlayContent
      }
  }

  @ViewBuilder
  private var baseContent: some View {
    ForEach(props.children?.withoutSlots() ?? [], id: \.id) { child in
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
