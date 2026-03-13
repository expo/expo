// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ContentShapeModifier: ViewModifier, Record {
  @Field var shape: ShapeType = .rectangle
  @Field var cornerRadius: CGFloat = 0
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case .capsule:
      content.contentShape(makeCapsule(style: roundedCornerStyle))
    case .circle:
      content.contentShape(Circle())
    case .ellipse:
      content.contentShape(Ellipse())
    case .rectangle:
      content.contentShape(Rectangle())
    case .roundedRectangle:
      content.contentShape(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
    }
  }
}