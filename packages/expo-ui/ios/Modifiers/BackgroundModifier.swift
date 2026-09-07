// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct BackgroundModifier: ViewModifier, Record {
  @Field var style: ShapeStyleValue?
  @Field var shape: ShapeType?
  @Field var cornerRadius: CGFloat = 0
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?
  @Field var ignoresSafeAreaEdges: EdgeOptions = .all

  @ViewBuilder
  func body(content: Content) -> some View {
    if let shapeStyle = style?.toAnyShapeStyle() {
      if let shapeType = shape {
        switch shapeType {
        case .capsule:
          content.background(shapeStyle, in: makeCapsule(style: roundedCornerStyle))
        case .circle:
          content.background(shapeStyle, in: Circle())
        case .containerRelativeShape:
          content.background(shapeStyle, in: ContainerRelativeShape())
        case .ellipse:
          content.background(shapeStyle, in: Ellipse())
        case .rectangle:
          content.background(shapeStyle, in: Rectangle())
        case .roundedRectangle:
          content.background(shapeStyle, in: makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
        }
      } else {
        content.background(shapeStyle, ignoresSafeAreaEdges: ignoresSafeAreaEdges.toEdge())
      }
    } else {
      content
    }
  }
}
