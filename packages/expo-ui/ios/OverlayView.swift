// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal class OverlayViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

internal struct OverlayView: ExpoSwiftUI.View {
  @ObservedObject var props: OverlayViewProps

  var body: some View {
    triggerContent
      .overlay(alignment: props.alignment?.toAlignment() ?? .center) {
        overlayContent
      }
  }

  @ViewBuilder
  private var triggerContent: some View {
    if let content = props.children?.slot("trigger") {
      content
    }
  }

  @ViewBuilder
  private var overlayContent: some View {
    if let content = props.children?.slot("content") {
      content
    }
  }
}
