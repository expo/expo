// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ToolbarViewProps: UIBaseViewProps {}

internal struct ToolbarView: ExpoSwiftUI.View {
  @ObservedObject var props: ToolbarViewProps

  init(props: ToolbarViewProps) {
    self.props = props
  }

  var body: some View {
    if let content = props.children?.slot("content") {
      baseContent
        .toolbar {
          content
        }
    } else {
      baseContent
    }
  }

  @ViewBuilder
  private var baseContent: some View {
    ForEach(props.children?.withoutSlots() ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }
}
