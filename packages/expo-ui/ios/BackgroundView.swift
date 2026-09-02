// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal class BackgroundViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

internal struct BackgroundView: ExpoSwiftUI.View {
  @ObservedObject var props: BackgroundViewProps

  var body: some View {
    baseContent
      .background(alignment: props.alignment?.toAlignment() ?? .center) {
        backgroundContent
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
  private var backgroundContent: some View {
    if let content = props.children?.slot("content") {
      content
    }
  }
}