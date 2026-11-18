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

internal enum ContentTransitionSymbolEffectKind: String, Enumerable {
  case automatic
  case replace
}

internal enum ReplaceSymbolEffectDirection: String, Enumerable {
  case downUp
  case upUp
  case offUp
}

internal struct ContentTransitionSymbolEffectConfig: Record {
  @Field var effect: ContentTransitionSymbolEffectKind = .automatic
  @Field var direction: ReplaceSymbolEffectDirection?
  @Field var scope: SymbolEffectScope?

  @available(iOS 17.0, tvOS 17.0, macOS 14.0, *)
  func toContentTransition(options: SymbolEffectOptions) -> ContentTransition {
    switch effect {
    case .automatic:
      return .symbolEffect(.automatic, options: options)
    case .replace:
      let directed: ReplaceSymbolEffect = switch direction {
      case .downUp: .replace.downUp
      case .upUp: .replace.upUp
      case .offUp: .replace.offUp
      default: .replace
      }
      return switch scope {
      case .byLayer: .symbolEffect(directed.byLayer, options: options)
      case .wholeSymbol: .symbolEffect(directed.wholeSymbol, options: options)
      default: .symbolEffect(directed, options: options)
      }
    }
  }
}

internal struct ContentTransitionModifier: ViewModifier, Record {
  @Field var transitionType: ContentTransitionType?
  @Field var countsDown: Bool = false
  @Field var symbolEffect: ContentTransitionSymbolEffectConfig?
  @Field var options: SymbolEffectOptionsConfig?

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
          content.contentTransition(
            (symbolEffect ?? ContentTransitionSymbolEffectConfig())
              .toContentTransition(options: options?.toSwiftUI() ?? .default)
          )
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
