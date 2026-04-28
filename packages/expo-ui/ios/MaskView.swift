// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal class MaskViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

internal struct MaskView: ExpoSwiftUI.View {
  @ObservedObject var props: MaskViewProps

  var body: some View {
    if let mask = props.children?.slot("content") {
      baseContent.mask(alignment: props.alignment?.toAlignment() ?? .center) {
        mask
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
