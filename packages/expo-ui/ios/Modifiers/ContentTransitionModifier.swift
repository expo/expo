// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ContentTransitionType: String, Enumerable {
  case numericText
  case identity
  case opacity
  case interpolate
  case symbolEffect
}

internal enum ReplaceSymbolEffectDirection: String, Enumerable {
  case downUp
  case upUp
  case offUp
}

internal struct ReplaceSymbolEffectConfig: Record {
  @Field var direction: ReplaceSymbolEffectDirection?
  @Field var scope: SymbolEffectScope?

  @available(iOS 17.0, tvOS 17.0, macOS 14.0, *)
  func toContentTransition() -> ContentTransition {
    let directed: ReplaceSymbolEffect = switch direction {
    case .downUp: .replace.downUp
    case .upUp: .replace.upUp
    case .offUp: .replace.offUp
    default: .replace
    }
    return switch scope {
    case .byLayer: .symbolEffect(directed.byLayer)
    case .wholeSymbol: .symbolEffect(directed.wholeSymbol)
    default: .symbolEffect(directed)
    }
  }
}

internal struct ContentTransitionModifier: ViewModifier, Record {
  @Field var transitionType: ContentTransitionType?
  @Field var countsDown: Bool = false
  @Field var symbolEffect: ReplaceSymbolEffectConfig?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      switch transitionType {
      case .numericText:
        content.contentTransition(.numericText(countsDown: countsDown))
      case .identity:
        content.contentTransition(.identity)
      case .opacity:
        content.contentTransition(.opacity)
      case .interpolate:
        content.contentTransition(.interpolate)
      case .symbolEffect:
        if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
          content.contentTransition(symbolEffect?.toContentTransition() ?? .symbolEffect)
        } else {
          content
        }
      default:
        content
      }
    } else {
      content
    }
  }
}
