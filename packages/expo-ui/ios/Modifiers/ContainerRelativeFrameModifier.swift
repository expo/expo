// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func containerRelativeFrameModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let axes: AxisOptions = try p.value("axes", .both)
  let count: Int = try p.value("count", 0)
  let span: Int = try p.value("span", 1)
  let spacing: CGFloat = try p.value("spacing", 0)
  let alignment: AlignmentOptions = try p.value("alignment", .center)
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
