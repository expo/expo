// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ContainerShapeModifier: ViewModifier, Record {
  @Field var shape: ShapeType = .rectangle
  @Field var cornerRadius: CGFloat = 0
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case .capsule:
      content.containerShape(makeCapsule(style: roundedCornerStyle))
    case .circle:
      content.containerShape(Circle())
    case .ellipse:
      content.containerShape(Ellipse())
    case .rectangle:
      content.containerShape(Rectangle())
    case .roundedRectangle:
      content.containerShape(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
    }
  }
}
