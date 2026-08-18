// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ContentShapeKind: String, Enumerable {
  case interaction
  case dragPreview
  case contextMenuPreview
  case hoverEffect
  case accessibility

  func toContentShapeKinds() -> ContentShapeKinds {
    switch self {
    case .interaction:
      return .interaction
    case .dragPreview:
      #if os(tvOS)
      return .interaction
      #else
      return .dragPreview
      #endif
    case .contextMenuPreview:
      if #available(iOS 15.0, tvOS 17.0, *) {
        return .contextMenuPreview
      }
      return .interaction
    case .hoverEffect:
      if #available(iOS 15.0, tvOS 18.0, *) {
        return .hoverEffect
      }
      return .interaction
    case .accessibility:
      if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
        return .accessibility
      }
      return .interaction
    }
  }
}

internal struct ContentShapeModifier: ViewModifier, Record {
  @Field var shape: ShapeType = .rectangle
  @Field var cornerRadius: CGFloat = 0
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?
  @Field var kind: [ContentShapeKind]?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case .capsule:
      applyContentShape(content, makeCapsule(style: roundedCornerStyle))
    case .circle:
      applyContentShape(content, Circle())
    case .containerRelativeShape:
      applyContentShape(content, ContainerRelativeShape())
    case .ellipse:
      applyContentShape(content, Ellipse())
    case .rectangle:
      applyContentShape(content, Rectangle())
    case .roundedRectangle:
      applyContentShape(content, makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
    }
  }

  @ViewBuilder
  private func applyContentShape(_ content: Content, _ shape: some Shape) -> some View {
    if let kind, !kind.isEmpty {
      content.contentShape(ContentShapeKinds(kind.map { $0.toContentShapeKinds() }), shape)
    } else {
      content.contentShape(shape)
    }
  }
}
