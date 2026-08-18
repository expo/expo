// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ContainerRelativeFrameModifier: ViewModifier, Record {
  @Field var axes: AxisOptions = .both
  @Field var count: Int = 0
  @Field var span: Int = 1
  @Field var spacing: CGFloat = 0
  @Field var alignment: AlignmentOptions = .center

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      if count > 0 {
        content.containerRelativeFrame(axes.toAxis(), count: count, span: span, spacing: spacing, alignment: alignment.toAlignment())
      } else {
        content.containerRelativeFrame(axes.toAxis(), alignment: alignment.toAlignment())
      }
    } else {
      content
    }
  }
}
