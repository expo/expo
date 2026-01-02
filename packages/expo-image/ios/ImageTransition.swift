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
  case sfBounceUp = "sf:bounce/up"
  case sfBounceDown = "sf:bounce/down"
  case sfBounceByLayer = "sf:bounce/by-layer"
  case sfBounceWholeSymbol = "sf:bounce/whole-symbol"
  case sfPulse = "sf:pulse"
  case sfPulseByLayer = "sf:pulse/by-layer"
  case sfPulseWholeSymbol = "sf:pulse/whole-symbol"
  case sfVariableColor = "sf:variable-color"
  case sfVariableColorIterative = "sf:variable-color/iterative"
  case sfVariableColorCumulative = "sf:variable-color/cumulative"
  case sfScale = "sf:scale"
  case sfScaleUp = "sf:scale/up"
  case sfScaleDown = "sf:scale/down"
  case sfScaleByLayer = "sf:scale/by-layer"
  case sfScaleWholeSymbol = "sf:scale/whole-symbol"
  case sfAppear = "sf:appear"
  case sfAppearByLayer = "sf:appear/by-layer"
  case sfAppearWholeSymbol = "sf:appear/whole-symbol"
  case sfDisappear = "sf:disappear"
  case sfDisappearByLayer = "sf:disappear/by-layer"
  case sfDisappearWholeSymbol = "sf:disappear/whole-symbol"
  case sfReplace = "sf:replace"
  // SF Symbol effects (iOS 18+)
  case sfWiggle = "sf:wiggle"
  case sfWiggleByLayer = "sf:wiggle/by-layer"
  case sfWiggleWholeSymbol = "sf:wiggle/whole-symbol"
  case sfRotate = "sf:rotate"
  case sfRotateByLayer = "sf:rotate/by-layer"
  case sfRotateWholeSymbol = "sf:rotate/whole-symbol"
  case sfBreathe = "sf:breathe"
  case sfBreatheByLayer = "sf:breathe/by-layer"
  case sfBreatheWholeSymbol = "sf:breathe/whole-symbol"
  case sfDrawOn = "sf:draw-on"

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
