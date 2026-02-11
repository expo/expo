// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum SFSymbolEffectType: String, Enumerable {
  case bounce = "bounce"
  case bounceUp = "bounce/up"
  case bounceDown = "bounce/down"
  case pulse = "pulse"
  case variableColor = "variable-color"
  case variableColorIterative = "variable-color/iterative"
  case variableColorCumulative = "variable-color/cumulative"
  case scale = "scale"
  case scaleUp = "scale/up"
  case scaleDown = "scale/down"
  case appear = "appear"
  case disappear = "disappear"
  // iOS 18+
  case wiggle = "wiggle"
  case rotate = "rotate"
  case breathe = "breathe"
  // iOS 26+
  case drawOn = "draw/on"
  case drawOff = "draw/off"
}

enum SFSymbolEffectScope: String, Enumerable {
  case byLayer = "by-layer"
  case wholeSymbol = "whole-symbol"
}

struct SFSymbolEffect: Record {
  @Field
  var effect: SFSymbolEffectType = .bounce

  @Field(.keyed("repeat"))
  var repeatCount: Int = 0

  @Field
  var scope: SFSymbolEffectScope?
}
