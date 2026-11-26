// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func backgroundModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ShapeStyleValue? = try p.value("style", nil)
  let shape: ShapeType? = try p.value("shape", nil)
  let cornerRadius: CGFloat = try p.value("cornerRadius", 0)
  let roundedCornerStyle: RoundedCornerStyle? = try p.value("roundedCornerStyle", nil)
  let cornerSize: CornerSize? = try p.value("cornerSize", nil)
  let ignoresSafeAreaEdges: EdgeOptions = try p.value("ignoresSafeAreaEdges", .all)
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
