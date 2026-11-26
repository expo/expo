// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func containerShapeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let shape: ShapeType = try p.value("shape", .rectangle)
  let cornerRadius: CGFloat = try p.value("cornerRadius", 0)
  let roundedCornerStyle: RoundedCornerStyle? = try p.value("roundedCornerStyle", nil)
  let cornerSize: CornerSize? = try p.value("cornerSize", nil)
  switch shape {
  case .capsule:
    content.containerShape(makeCapsule(style: roundedCornerStyle))
  case .circle:
    content.containerShape(Circle())
  case .containerRelativeShape:
    content.containerShape(ContainerRelativeShape())
  case .ellipse:
    content.containerShape(Ellipse())
  case .rectangle:
    content.containerShape(Rectangle())
  case .roundedRectangle:
    content.containerShape(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
  }
}
