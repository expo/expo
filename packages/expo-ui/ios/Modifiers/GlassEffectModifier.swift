// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum GlassEffectShape: String, Enumerable {
  case capsule
  case circle
  case ellipse
  case rectangle
  case roundedRectangle
}

internal enum GlassEffectVariant: String, Enumerable {
  case regular
  case clear
  case identity
}

internal struct GlassEffectOptions: Record {
  @Field var variant: GlassEffectVariant?
  @Field var interactive: Bool?
  @Field var tint: Color?
}

internal struct GlassEffectModifier: ViewModifier, Record {
  @Field var glass: GlassEffectOptions?
  @Field var shape: GlassEffectShape = .capsule
  @Field var cornerRadius: CGFloat = 0

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      let interactive = glass?.interactive ?? false
      let tint = glass?.tint
      let glass = parseGlassVariant(glass?.variant ?? .regular)
      switch shape {
      case .capsule:
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Capsule())
      case .circle:
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Circle())
      case .ellipse:
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Ellipse())
      case .rectangle:
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Rectangle())
      case .roundedRectangle:
        content.glassEffect(glass.interactive(interactive).tint(tint), in: RoundedRectangle(cornerRadius: cornerRadius))
      }
      #else
      content
      #endif
    } else {
      content
    }
  }

  #if compiler(>=6.2) // Xcode 26
  @available(iOS 26.0, macOS 26.0, tvOS 26.0, *)
  private func parseGlassVariant(_ variant: GlassEffectVariant) -> Glass {
    switch variant {
    case .regular:
      return .regular
    case .clear:
      return .clear
    case .identity:
      return .identity
    }
  }
  #endif
}

internal struct GlassEffectIdModifier: ViewModifier, Record {
  @Field var id: String?
  @Field var namespaceId: String?

  func body(content: Content) -> some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      if let namespaceId, let namespace = NamespaceRegistry.shared.namespace(forKey: namespaceId) {
        content.glassEffectID(id, in: namespace)
      } else {
        content
      }
      #else
      content
      #endif
    } else {
      content
    }
  }
}
