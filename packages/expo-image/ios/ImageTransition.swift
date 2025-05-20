// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum ImageTransitionTiming: String, Enumerable {
  case easeInOut = "ease-in-out"
  case easeIn = "ease-in"
  case easeOut = "ease-out"
  case linear = "linear"
  
#if canImport(UIKit)
  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .easeInOut: return .curveEaseInOut
    case .easeIn:    return .curveEaseIn
    case .easeOut:   return .curveEaseOut
    case .linear:    return .curveLinear
    }
  }
#elseif canImport(AppKit)
  func toTimingFunction() -> CAMediaTimingFunction {
    switch self {
    case .easeInOut:
      return CAMediaTimingFunction(name: .easeInEaseOut)
    case .easeIn:
      return CAMediaTimingFunction(name: .easeIn)
    case .easeOut:
      return CAMediaTimingFunction(name: .easeOut)
    case .linear:
      return CAMediaTimingFunction(name: .linear)
    }
  }
#endif
  
}

enum ImageTransitionEffect: String, Enumerable {
  case crossDissolve = "cross-dissolve"
  case flipFromTop = "flip-from-top"
  case flipFromRight = "flip-from-right"
  case flipFromBottom = "flip-from-bottom"
  case flipFromLeft = "flip-from-left"
  case curlUp = "curl-up"
  case curlDown = "curl-down"

  
#if os(iOS) || os(tvOS)
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
    }
  }
  #endif
}

struct ImageTransition: Record {
  @Field
  var duration: Double = 100

  @Field
  var timing: ImageTransitionTiming = .easeInOut

  @Field
  var effect: ImageTransitionEffect = .crossDissolve

#if os(iOS) || os(tvOS)
  func toAnimationOptions() -> UIView.AnimationOptions {
    return [timing.toAnimationOption(), effect.toAnimationOption()]
  }
#endif
}
