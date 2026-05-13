// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Effect kind

internal enum SymbolEffectKind: String, Enumerable {
  case appear
  case automatic
  case bounce
  case breathe
  case disappear
  case drawOff
  case drawOn
  case pulse
  case replace
  case rotate
  case scale
  case variableColor
  case wiggle
}

// MARK: - Options config

internal enum SymbolEffectRepeatKind: String, Enumerable {
  case continuous
  case nonRepeating
  case periodic
}

internal struct SymbolEffectOptionsConfig: Record {
  @Field var repeatKind: SymbolEffectRepeatKind?
  @Field var repeatCount: Int?
  @Field var repeatDelay: Double?
  @Field var speed: Double?

  @available(iOS 17.0, tvOS 17.0, *)
  func toSwiftUI() -> SymbolEffectOptions {
    var options: SymbolEffectOptions = .default

    switch repeatKind {
    case .nonRepeating:
      options = .nonRepeating
    case .continuous:
      if #available(iOS 18.0, tvOS 18.0, *) {
        options = .repeat(.continuous)
      }
      // iOS 17: indefinite effects loop by default, so `.default` is fine here.
    case .periodic:
      if #available(iOS 18.0, tvOS 18.0, *) {
        options = .repeat(.periodic(repeatCount, delay: repeatDelay))
      }
    case .none:
      break
    }

    if let speed {
      options = options.speed(speed)
    }
    return options
  }
}

// MARK: - Effect config
//
internal struct SymbolEffectConfig: Record {
  @Field var effect: SymbolEffectKind = .pulse
  @Field var direction: String?
  @Field var scale: String?
  @Field var style: String?
  @Field var customAngle: Double?
  @Field var fillStyle: String?
  @Field var playbackStyle: String?
  @Field var inactiveLayers: String?
  @Field var scope: String?
}

// MARK: - Modifier

internal struct SymbolEffectModifier: ViewModifier, Record {
  @Field var effect: SymbolEffectConfig
  @Field var options: SymbolEffectOptionsConfig?
  @Field var isActive: ObservableState?
  @Field var value: ObservableState?

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      let resolvedOptions = options?.toSwiftUI() ?? .default
      if let value {
        DiscreteEffectView(
          config: effect,
          options: resolvedOptions,
          state: value
        ) {
          content
        }
      } else if let isActive {
        IndefiniteEffectView(
          config: effect,
          options: resolvedOptions,
          state: isActive
        ) {
          content
        }
      } else {
        applyIndefiniteEffect(
          to: content,
          config: effect,
          options: resolvedOptions,
          isActive: true
        )
      }
    } else {
      content
    }
  }
}

// MARK: - Per-effect builders

@available(iOS 17.0, tvOS 17.0, *)
private func buildPulseEffect(_ config: SymbolEffectConfig) -> PulseSymbolEffect {
  var pulseEffect: PulseSymbolEffect = .pulse
  switch config.scope {
  case "byLayer":
    pulseEffect = pulseEffect.byLayer
  case "wholeSymbol":
    pulseEffect = pulseEffect.wholeSymbol
  default:
    break
  }
  return pulseEffect
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildBounceEffect(_ config: SymbolEffectConfig) -> BounceSymbolEffect {
  var bounceEffect: BounceSymbolEffect = .bounce
  switch config.direction {
  case "up":
    bounceEffect = bounceEffect.up
  case "down":
    bounceEffect = bounceEffect.down
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    bounceEffect = bounceEffect.byLayer
  case "wholeSymbol":
    bounceEffect = bounceEffect.wholeSymbol
  default:
    break
  }
  return bounceEffect
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildVariableColorEffect(_ config: SymbolEffectConfig) -> VariableColorSymbolEffect {
  var variableColorEffect: VariableColorSymbolEffect = .variableColor
  switch config.fillStyle {
  case "iterative":
    variableColorEffect = variableColorEffect.iterative
  case "cumulative":
    variableColorEffect = variableColorEffect.cumulative
  default:
    break
  }
  switch config.playbackStyle {
  case "reversing":
    variableColorEffect = variableColorEffect.reversing
  case "nonReversing":
    variableColorEffect = variableColorEffect.nonReversing
  default:
    break
  }
  switch config.inactiveLayers {
  case "dim":
    variableColorEffect = variableColorEffect.dimInactiveLayers
  case "hide":
    variableColorEffect = variableColorEffect.hideInactiveLayers
  default:
    break
  }
  return variableColorEffect
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildScaleEffect(_ config: SymbolEffectConfig) -> ScaleSymbolEffect {
  var scaleEffect: ScaleSymbolEffect = .scale
  switch config.scale {
  case "up":
    scaleEffect = scaleEffect.up
  case "down":
    scaleEffect = scaleEffect.down
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    scaleEffect = scaleEffect.byLayer
  case "wholeSymbol":
    scaleEffect = scaleEffect.wholeSymbol
  default:
    break
  }
  return scaleEffect
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildAppearEffect(_ config: SymbolEffectConfig) -> AppearSymbolEffect {
  var appearEffect: AppearSymbolEffect = .appear
  switch config.scale {
  case "up":
    appearEffect = appearEffect.up
  case "down":
    appearEffect = appearEffect.down
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    appearEffect = appearEffect.byLayer
  case "wholeSymbol":
    appearEffect = appearEffect.wholeSymbol
  default:
    break
  }
  return appearEffect
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildDisappearEffect(_ config: SymbolEffectConfig) -> DisappearSymbolEffect {
  var disappearEffect: DisappearSymbolEffect = .disappear
  switch config.scale {
  case "up":
    disappearEffect = disappearEffect.up
  case "down":
    disappearEffect = disappearEffect.down
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    disappearEffect = disappearEffect.byLayer
  case "wholeSymbol":
    disappearEffect = disappearEffect.wholeSymbol
  default:
    break
  }
  return disappearEffect
}

@available(iOS 18.0, tvOS 18.0, *)
private func buildWiggleEffect(_ config: SymbolEffectConfig) -> WiggleSymbolEffect {
  var wiggleEffect: WiggleSymbolEffect = .wiggle
  if let angle = config.customAngle {
    wiggleEffect = wiggleEffect.custom(angle: angle)
  } else {
    switch config.direction {
    case "up":
      wiggleEffect = wiggleEffect.up
    case "down":
      wiggleEffect = wiggleEffect.down
    case "left":
      wiggleEffect = wiggleEffect.left
    case "right":
      wiggleEffect = wiggleEffect.right
    case "forward":
      wiggleEffect = wiggleEffect.forward
    case "backward":
      wiggleEffect = wiggleEffect.backward
    case "clockwise":
      wiggleEffect = wiggleEffect.clockwise
    case "counterClockwise":
      wiggleEffect = wiggleEffect.counterClockwise
    default:
      break
    }
  }
  switch config.scope {
  case "byLayer":
    wiggleEffect = wiggleEffect.byLayer
  case "wholeSymbol":
    wiggleEffect = wiggleEffect.wholeSymbol
  default:
    break
  }
  return wiggleEffect
}

@available(iOS 18.0, tvOS 18.0, *)
private func buildBreatheEffect(_ config: SymbolEffectConfig) -> BreatheSymbolEffect {
  var breatheEffect: BreatheSymbolEffect = .breathe
  switch config.style {
  case "pulse":
    breatheEffect = breatheEffect.pulse
  case "plain":
    breatheEffect = breatheEffect.plain
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    breatheEffect = breatheEffect.byLayer
  case "wholeSymbol":
    breatheEffect = breatheEffect.wholeSymbol
  default:
    break
  }
  return breatheEffect
}

@available(iOS 18.0, tvOS 18.0, *)
private func buildRotateEffect(_ config: SymbolEffectConfig) -> RotateSymbolEffect {
  var rotateEffect: RotateSymbolEffect = .rotate
  switch config.direction {
  case "clockwise":
    rotateEffect = rotateEffect.clockwise
  case "counterClockwise":
    rotateEffect = rotateEffect.counterClockwise
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    rotateEffect = rotateEffect.byLayer
  case "wholeSymbol":
    rotateEffect = rotateEffect.wholeSymbol
  default:
    break
  }
  return rotateEffect
}

@available(iOS 26.0, tvOS 26.0, *)
private func buildDrawOnEffect(_ config: SymbolEffectConfig) -> DrawOnSymbolEffect {
  var drawOnEffect: DrawOnSymbolEffect = .drawOn
  switch config.scope {
  case "byLayer":
    drawOnEffect = drawOnEffect.byLayer
  case "individually":
    drawOnEffect = drawOnEffect.individually
  case "wholeSymbol":
    drawOnEffect = drawOnEffect.wholeSymbol
  default:
    break
  }
  return drawOnEffect
}

@available(iOS 26.0, tvOS 26.0, *)
private func buildDrawOffEffect(_ config: SymbolEffectConfig) -> DrawOffSymbolEffect {
  var drawOffEffect: DrawOffSymbolEffect = .drawOff
  switch config.playbackStyle {
  case "reversed":
    drawOffEffect = drawOffEffect.reversed
  case "nonReversed":
    drawOffEffect = drawOffEffect.nonReversed
  default:
    break
  }
  switch config.scope {
  case "byLayer":
    drawOffEffect = drawOffEffect.byLayer
  case "individually":
    drawOffEffect = drawOffEffect.individually
  case "wholeSymbol":
    drawOffEffect = drawOffEffect.wholeSymbol
  default:
    break
  }
  return drawOffEffect
}

// MARK: - Dispatch

@available(iOS 17.0, tvOS 17.0, *)
@ViewBuilder
private func applyIndefiniteEffect<TargetView: View>(
  to view: TargetView,
  config: SymbolEffectConfig,
  options: SymbolEffectOptions,
  isActive: Bool
) -> some View {
  switch config.effect {
  case .pulse:
    view.symbolEffect(buildPulseEffect(config), options: options, isActive: isActive)
  case .bounce:
    view.symbolEffect(buildBounceEffect(config), options: options, isActive: isActive)
  case .variableColor:
    view.symbolEffect(buildVariableColorEffect(config), options: options, isActive: isActive)
  case .scale:
    view.symbolEffect(buildScaleEffect(config), options: options, isActive: isActive)
  case .appear:
    view.symbolEffect(buildAppearEffect(config), options: options, isActive: isActive)
  case .disappear:
    view.symbolEffect(buildDisappearEffect(config), options: options, isActive: isActive)
  case .wiggle:
    if #available(iOS 18.0, tvOS 18.0, *) {
      view.symbolEffect(buildWiggleEffect(config), options: options, isActive: isActive)
    } else {
      view
    }
  case .breathe:
    if #available(iOS 18.0, tvOS 18.0, *) {
      view.symbolEffect(buildBreatheEffect(config), options: options, isActive: isActive)
    } else {
      view
    }
  case .rotate:
    if #available(iOS 18.0, tvOS 18.0, *) {
      view.symbolEffect(buildRotateEffect(config), options: options, isActive: isActive)
    } else {
      view
    }
  case .drawOn:
    if #available(iOS 26.0, tvOS 26.0, *) {
      view.symbolEffect(buildDrawOnEffect(config), options: options, isActive: isActive)
    } else {
      view
    }
  case .drawOff:
    if #available(iOS 26.0, tvOS 26.0, *) {
      view.symbolEffect(buildDrawOffEffect(config), options: options, isActive: isActive)
    } else {
      view
    }
  // Replace and Automatic don't conform to IndefiniteSymbolEffect — they no-op.
  case .replace, .automatic:
    view
  }
}

@available(iOS 17.0, tvOS 17.0, *)
@ViewBuilder
private func applyDiscreteEffect<TargetView: View>(
  to view: TargetView,
  config: SymbolEffectConfig,
  options: SymbolEffectOptions,
  value: AnyHashable
) -> some View {
  switch config.effect {
  case .pulse:
    view.symbolEffect(buildPulseEffect(config), options: options, value: value)
  case .bounce:
    view.symbolEffect(buildBounceEffect(config), options: options, value: value)
  case .variableColor:
    view.symbolEffect(buildVariableColorEffect(config), options: options, value: value)
  case .wiggle:
    if #available(iOS 18.0, tvOS 18.0, *) {
      view.symbolEffect(buildWiggleEffect(config), options: options, value: value)
    } else {
      view
    }
  case .breathe:
    if #available(iOS 18.0, tvOS 18.0, *) {
      view.symbolEffect(buildBreatheEffect(config), options: options, value: value)
    } else {
      view
    }
  case .rotate:
    if #available(iOS 18.0, tvOS 18.0, *) {
      view.symbolEffect(buildRotateEffect(config), options: options, value: value)
    } else {
      view
    }
  // Scale, Appear, Disappear, DrawOn, DrawOff, Replace, Automatic don't conform
  // to DiscreteSymbolEffect — they no-op when bound to a `value`.
  case .scale, .appear, .disappear, .drawOn, .drawOff, .replace, .automatic:
    view
  }
}

// MARK: - Discrete wrapper

@available(iOS 17.0, tvOS 17.0, *)
private struct DiscreteEffectView<WrappedContent: View>: View {
  let config: SymbolEffectConfig
  let options: SymbolEffectOptions
  @ObservedObject var state: ObservableState
  @ViewBuilder let content: () -> WrappedContent

  var body: some View {
    let trigger = (state.value as? AnyHashable) ?? AnyHashable(0)
    applyDiscreteEffect(to: content(), config: config, options: options, value: trigger)
  }
}

// MARK: - Indefinite wrapper

@available(iOS 17.0, tvOS 17.0, *)
private struct IndefiniteEffectView<WrappedContent: View>: View {
  let config: SymbolEffectConfig
  let options: SymbolEffectOptions
  @ObservedObject var state: ObservableState
  @ViewBuilder let content: () -> WrappedContent

  var body: some View {
    let active = (state.value as? Bool) ?? true
    applyIndefiniteEffect(to: content(), config: config, options: options, isActive: active)
  }
}