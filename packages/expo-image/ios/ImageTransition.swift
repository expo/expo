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
  // SF Symbol replace effects (iOS 17+)
  case sfReplace = "sf:replace"
  case sfDownUp = "sf:down-up"
  case sfUpUp = "sf:up-up"
  case sfOffUp = "sf:off-up"

  var isSFReplaceEffect: Bool {
    switch self {
    case .sfReplace, .sfDownUp, .sfUpUp, .sfOffUp:
      return true
    default:
      return false
    }
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

enum ImageTransitionCacheSkip: String, Enumerable {
  case none
  case memory
  case all

  func skips(cacheType: ImageCacheType) -> Bool {
    switch self {
    case .none:
      return false
    case .memory:
      return cacheType == .memory
    case .all:
      return cacheType == .memory || cacheType == .disk
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

  @Field
  var skipOnCacheHit: ImageTransitionCacheSkip = .none

  func toAnimationOptions() -> UIView.AnimationOptions {
    return [timing.toAnimationOption(), effect.toAnimationOption()]
  }

  func shouldPlay(forCacheType cacheType: ImageCacheType, isInitialDisplay: Bool) -> Bool {
    guard isInitialDisplay else {
      return true
    }
    return !skipOnCacheHit.skips(cacheType: cacheType)
  }
}
