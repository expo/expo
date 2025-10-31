// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct BackgroundModifier: ViewModifier, Record {
  @Field var color: Color?
  @Field var shape: ShapeType?
  @Field var cornerRadius: CGFloat = 0
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let color = color {
      if let shapeType = shape {
        switch shapeType {
        case .capsule:
          content.background(color, in: makeCapsule(style: roundedCornerStyle))
        case .circle:
          content.background(color, in: Circle())
        case .ellipse:
          content.background(color, in: Ellipse())
        case .rectangle:
          content.background(color, in: Rectangle())
        case .roundedRectangle:
          content.background(color, in: makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
        }
      } else {
        // Default behavior when no shape is specified
        content.background(color)
      }
    } else {
      content
    }
  }
}
