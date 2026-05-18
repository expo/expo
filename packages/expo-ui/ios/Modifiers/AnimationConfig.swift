// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum AnimationType: String, Enumerable {
  case easeInOut
  case easeIn
  case easeOut
  case linear
  case spring
  case interpolatingSpring
  case `default`
}

internal enum AnimationCompletionCriteriaType: String, Enumerable {
  case logicallyComplete
  case removed
}

/**
 Describes a SwiftUI `Animation` value over the JS bridge. Consumed by both
 the `animation(_:value:)` view modifier and the `withAnimation(_:_:)`
 function so they accept the same JS shape.
 */
internal struct AnimationConfig: Record {
  // Shared fallbacks used when the JS side omits a parameter. Mirrors
  // SwiftUI's own defaults so each animation variant resolves the same way.
  private static let defaultDuration: Double = 0.5
  private static let defaultResponse: Double = 0.5
  private static let defaultDampingFraction: Double = 0.825
  private static let defaultBlendDuration: Double = 0.0
  private static let defaultBounce: Double = 0.0

  @Field var type: AnimationType = .default
  @Field var duration: Double?
  @Field var response: Double?
  @Field var dampingFraction: Double?
  @Field var blendDuration: Double?
  @Field var bounce: Double?
  @Field var mass: Double = 1.0
  @Field var stiffness: Double?
  @Field var damping: Double?
  @Field var initialVelocity: Double = 0.0
  @Field var delay: Double?
  @Field var repeatCount: Int?
  @Field var autoreverses: Bool = true

  func toSwiftUIAnimation() -> Animation {
    var animation: Animation

    switch type {
    case .easeIn:
      animation = duration.map { Animation.easeIn(duration: $0) } ?? .easeIn
    case .easeOut:
      animation = duration.map { Animation.easeOut(duration: $0) } ?? .easeOut
    case .linear:
      animation = duration.map { Animation.linear(duration: $0) } ?? .linear
    case .easeInOut:
      animation = duration.map { Animation.easeInOut(duration: $0) } ?? .easeInOut
    case .spring:
      if response != nil || dampingFraction != nil {
        animation = .spring(
          response: response ?? Self.defaultResponse,
          dampingFraction: dampingFraction ?? Self.defaultDampingFraction,
          blendDuration: blendDuration ?? Self.defaultBlendDuration
        )
      } else if duration != nil || bounce != nil {
        animation = .spring(
          duration: duration ?? Self.defaultDuration,
          bounce: bounce ?? Self.defaultBounce,
          blendDuration: blendDuration ?? Self.defaultBlendDuration
        )
      } else if let blendDuration {
        animation = .spring(blendDuration: blendDuration)
      } else {
        animation = .spring
      }
    case .interpolatingSpring:
      if duration != nil || bounce != nil {
        animation = .interpolatingSpring(
          duration: duration ?? Self.defaultDuration,
          bounce: bounce ?? Self.defaultBounce,
          initialVelocity: initialVelocity
        )
      } else if let stiffness, let damping {
        animation = .interpolatingSpring(
          mass: mass,
          stiffness: stiffness,
          damping: damping,
          initialVelocity: initialVelocity
        )
      } else {
        animation = .interpolatingSpring
      }
    default:
      animation = .default
    }

    if let delay {
      animation = animation.delay(delay)
    }
    if let repeatCount {
      animation = animation.repeatCount(repeatCount, autoreverses: autoreverses)
    }

    return animation
  }
}
