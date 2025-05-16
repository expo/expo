// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal protocol CommonViewModifierProps {
  var fixedSize: Bool? { get }
  var frame: FrameOptions? { get }
  var padding: PaddingOptions? { get }
}

internal struct CommonViewModifiers: ViewModifier {
  let props: CommonViewModifierProps
  var defaultFrameAlignment = Alignment.center

  func body(content: Content) -> some View {
    content
      .applyFixedSize(props.fixedSize)
      .applyFrame(props.frame, defaultAlignment: defaultFrameAlignment)
      .applyPadding(props.padding)
  }
}
