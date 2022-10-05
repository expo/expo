// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum ImageTransitionTiming: Int, EnumArgument {
  case none = 0
  case easeInOut = 1
  case easeIn = 2
  case easeOut = 3
  case linear = 4

  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .none:
      return []
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

enum ImageTransitionEffect: UInt, EnumArgument {
  case none = 0
  case crossDissolve = 1
  case flipFromLeft = 2
  case flipFromRight = 3
  case flipFromTop = 4
  case flipFromBottom = 5
  case curlUp = 6
  case curlDown = 7

  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .none:
      return []
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
    }
  }
}

struct ImageTransition: Record {
  @Field
  var duration: Double = 0.1

  @Field
  var timing: ImageTransitionTiming = .easeInOut

  @Field
  var effect: ImageTransitionEffect = .crossDissolve

  func toAnimationOptions() -> UIView.AnimationOptions {
    return [timing.toAnimationOption(), effect.toAnimationOption()]
  }
}
