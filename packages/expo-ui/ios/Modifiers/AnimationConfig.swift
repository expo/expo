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
 the `animation(_:value:)` view modifier and the `withAnimated(_:_:)`
 function so they accept the same JS shape.
 */
internal struct AnimationConfig: Record {
  @Field var type: AnimationType = .default
  @Field var duration: Double?
  @Field var response: Double?
  @Field var dampingFraction: Double?
  @Field var blendDuration: Double?
  @Field var bounce: Double?
  @Field var mass: Double?
  @Field var stiffness: Double?
  @Field var damping: Double?
  @Field var initialVelocity: Double?
  @Field var delay: Double?
  @Field var repeatCount: Int?
  @Field var autoreverses: Bool?

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
          response: response ?? 0.5,
          dampingFraction: dampingFraction ?? 0.825,
          blendDuration: blendDuration ?? 0.0
        )
      } else if duration != nil || bounce != nil {
        animation = .spring(
          duration: duration ?? 0.5,
          bounce: bounce ?? 0.0,
          blendDuration: blendDuration ?? 0.0
        )
      } else if let blendDuration {
        animation = .spring(blendDuration: blendDuration)
      } else {
        animation = .spring
      }
    case .interpolatingSpring:
      if duration != nil || bounce != nil {
        animation = .interpolatingSpring(
          duration: duration ?? 0.5,
          bounce: bounce ?? 0.0,
          initialVelocity: initialVelocity ?? 0.0
        )
      } else if let stiffness, let damping {
        animation = .interpolatingSpring(
          mass: mass ?? 1.0,
          stiffness: stiffness,
          damping: damping,
          initialVelocity: initialVelocity ?? 0.0
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
      animation = animation.repeatCount(repeatCount, autoreverses: autoreverses ?? false)
    }

    return animation
  }
}
