// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Symbols

enum ImageTransitionTiming: String, Enumerable {
  case easeInOut = "ease-in-out"
  case easeIn = "ease-in"
  case easeOut = "ease-out"
  case linear = "linear"

  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .easeInOut:
      return .curveEaseInOut
    case .easeIn:
      return .curveEaseIn
    case .easeOut:
      return .curveEaseOut
    case .linear:
      return .curveLinear
    }
  }
}

enum ImageTransitionEffect: String, Enumerable {
  case crossDissolve = "cross-dissolve"
  case flipFromTop = "flip-from-top"
  case flipFromRight = "flip-from-right"
  case flipFromBottom = "flip-from-bottom"
  case flipFromLeft = "flip-from-left"
  case curlUp = "curl-up"
  case curlDown = "curl-down"
  // SF Symbol effects (iOS 17+)
  case sfBounce = "sf:bounce"
  case sfPulse = "sf:pulse"
  case sfVariableColor = "sf:variable-color"
  case sfScale = "sf:scale"
  case sfAppear = "sf:appear"
  case sfDisappear = "sf:disappear"
  case sfReplace = "sf:replace"

  var isSFSymbolEffect: Bool {
    return rawValue.hasPrefix("sf:")
  }

  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .crossDissolve:
      return .transitionCrossDissolve
    case .flipFromLeft:
      return .transitionFlipFromLeft
    case .flipFromRight:
      return .transitionFlipFromRight
    case .flipFromTop:
      return .transitionFlipFromTop
    case .flipFromBottom:
      return .transitionFlipFromBottom
    case .curlUp:
      return .transitionCurlUp
    case .curlDown:
      return .transitionCurlDown
    default:
      return .transitionCrossDissolve
    }
  }
}

struct ImageTransition: Record {
  @Field
  var duration: Double = 100

  @Field
  var timing: ImageTransitionTiming = .easeInOut

  @Field
  var effect: ImageTransitionEffect = .crossDissolve

  @Field(.keyed("repeat"))
  var repeatCount: Int = 0

  func toAnimationOptions() -> UIView.AnimationOptions {
    return [timing.toAnimationOption(), effect.toAnimationOption()]
  }
}
