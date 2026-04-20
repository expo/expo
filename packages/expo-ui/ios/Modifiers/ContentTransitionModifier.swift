// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ContentTransitionType: String, Enumerable {
  case numericText
  case identity
  case opacity
  case interpolate
}

internal struct ContentTransitionModifier: ViewModifier, Record {
  @Field var transitionType: ContentTransitionType?
  @Field var countsDown: Bool = false

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
      default:
        content
      }
    } else {
      content
    }
  }
}
