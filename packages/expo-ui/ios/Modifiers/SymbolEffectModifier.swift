// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Effect kind

internal enum SymbolEffectKind: String, Enumerable {
  case appear
  case bounce
  case breathe
  case disappear
  case drawOff
  case drawOn
  case pulse
  case rotate
  case scale
  case variableColor
  case wiggle
}

// MARK: - Effect option enums

internal enum SymbolEffectScope: String, Enumerable {
  case byLayer
  case wholeSymbol
  case individually
}

internal enum SymbolEffectDirection: String, Enumerable {
  case up
  case down
  case left
  case right
  case forward
  case backward
  case clockwise
  case counterClockwise
}

internal enum SymbolEffectScale: String, Enumerable {
  case up
  case down
}

internal enum SymbolEffectBreatheStyle: String, Enumerable {
  case plain
  case pulse
}

internal enum SymbolEffectFillStyle: String, Enumerable {
  case iterative
  case cumulative
}

internal enum SymbolEffectPlaybackStyle: String, Enumerable {
  case reversing
  case nonReversing
  case reversed
  case nonReversed
}

internal enum SymbolEffectInactiveLayers: String, Enumerable {
  case dim
  case hide
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

internal struct SymbolEffectConfig: Record {
  @Field var effect: SymbolEffectKind = .pulse
  @Field var direction: SymbolEffectDirection?
  @Field var scale: SymbolEffectScale?
  @Field var style: SymbolEffectBreatheStyle?
  @Field var customAngle: Double?
  @Field var fillStyle: SymbolEffectFillStyle?
  @Field var playbackStyle: SymbolEffectPlaybackStyle?
  @Field var inactiveLayers: SymbolEffectInactiveLayers?
  @Field var scope: SymbolEffectScope?
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
  return switch config.scope {
  case .byLayer: .pulse.byLayer
  case .wholeSymbol: .pulse.wholeSymbol
  default: .pulse
  }
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildBounceEffect(_ config: SymbolEffectConfig) -> BounceSymbolEffect {
  let directed: BounceSymbolEffect = switch config.direction {
  case .up: .bounce.up
  case .down: .bounce.down
  default: .bounce
  }
  return switch config.scope {
  case .byLayer: directed.byLayer
  case .wholeSymbol: directed.wholeSymbol
  default: directed
  }
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildVariableColorEffect(_ config: SymbolEffectConfig) -> VariableColorSymbolEffect {
  let filled: VariableColorSymbolEffect = switch config.fillStyle {
  case .iterative: .variableColor.iterative
  case .cumulative: .variableColor.cumulative
  default: .variableColor
  }
  let playing: VariableColorSymbolEffect = switch config.playbackStyle {
  case .reversing: filled.reversing
  case .nonReversing: filled.nonReversing
  default: filled
  }
  return switch config.inactiveLayers {
  case .dim: playing.dimInactiveLayers
  case .hide: playing.hideInactiveLayers
  default: playing
  }
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildScaleEffect(_ config: SymbolEffectConfig) -> ScaleSymbolEffect {
  let scaled: ScaleSymbolEffect = switch config.scale {
  case .up: .scale.up
  case .down: .scale.down
  default: .scale
  }
  return switch config.scope {
  case .byLayer: scaled.byLayer
  case .wholeSymbol: scaled.wholeSymbol
  default: scaled
  }
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildAppearEffect(_ config: SymbolEffectConfig) -> AppearSymbolEffect {
  let scaled: AppearSymbolEffect = switch config.scale {
  case .up: .appear.up
  case .down: .appear.down
  default: .appear
  }
  return switch config.scope {
  case .byLayer: scaled.byLayer
  case .wholeSymbol: scaled.wholeSymbol
  default: scaled
  }
}

@available(iOS 17.0, tvOS 17.0, *)
private func buildDisappearEffect(_ config: SymbolEffectConfig) -> DisappearSymbolEffect {
  let scaled: DisappearSymbolEffect = switch config.scale {
  case .up: .disappear.up
  case .down: .disappear.down
  default: .disappear
  }
  return switch config.scope {
  case .byLayer: scaled.byLayer
  case .wholeSymbol: scaled.wholeSymbol
  default: scaled
  }
}

@available(iOS 18.0, tvOS 18.0, *)
private func buildWiggleEffect(_ config: SymbolEffectConfig) -> WiggleSymbolEffect {
  let directed: WiggleSymbolEffect = if let angle = config.customAngle {
    .wiggle.custom(angle: angle)
  } else {
    switch config.direction {
    case .up: .wiggle.up
    case .down: .wiggle.down
    case .left: .wiggle.left
    case .right: .wiggle.right
    case .forward: .wiggle.forward
    case .backward: .wiggle.backward
    case .clockwise: .wiggle.clockwise
    case .counterClockwise: .wiggle.counterClockwise
    default: .wiggle
    }
  }
  return switch config.scope {
  case .byLayer: directed.byLayer
  case .wholeSymbol: directed.wholeSymbol
  default: directed
  }
}

@available(iOS 18.0, tvOS 18.0, *)
private func buildBreatheEffect(_ config: SymbolEffectConfig) -> BreatheSymbolEffect {
  let styled: BreatheSymbolEffect = switch config.style {
  case .pulse: .breathe.pulse
  case .plain: .breathe.plain
  default: .breathe
  }
  return switch config.scope {
  case .byLayer: styled.byLayer
  case .wholeSymbol: styled.wholeSymbol
  default: styled
  }
}

@available(iOS 18.0, tvOS 18.0, *)
private func buildRotateEffect(_ config: SymbolEffectConfig) -> RotateSymbolEffect {
  let directed: RotateSymbolEffect = switch config.direction {
  case .clockwise: .rotate.clockwise
  case .counterClockwise: .rotate.counterClockwise
  default: .rotate
  }
  return switch config.scope {
  case .byLayer: directed.byLayer
  case .wholeSymbol: directed.wholeSymbol
  default: directed
  }
}

@available(iOS 26.0, tvOS 26.0, *)
private func buildDrawOnEffect(_ config: SymbolEffectConfig) -> DrawOnSymbolEffect {
  return switch config.scope {
  case .byLayer: .drawOn.byLayer
  case .individually: .drawOn.individually
  case .wholeSymbol: .drawOn.wholeSymbol
  default: .drawOn
  }
}

@available(iOS 26.0, tvOS 26.0, *)
private func buildDrawOffEffect(_ config: SymbolEffectConfig) -> DrawOffSymbolEffect {
  let played: DrawOffSymbolEffect = switch config.playbackStyle {
  case .reversed: .drawOff.reversed
  case .nonReversed: .drawOff.nonReversed
  default: .drawOff
  }
  return switch config.scope {
  case .byLayer: played.byLayer
  case .individually: played.individually
  case .wholeSymbol: played.wholeSymbol
  default: played
  }
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
  // Scale, Appear, Disappear, DrawOn, DrawOff don't conform to
  // DiscreteSymbolEffect — they no-op when bound to a `value`.
  case .scale, .appear, .disappear, .drawOn, .drawOff:
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
