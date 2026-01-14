// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

// MARK: - Presentation Detents

internal enum PresentationDetentPreset: String, Enumerable {
  case medium
  case large
}

internal struct PresentationDetentItem: Record {
  @Field var fraction: Double?
  @Field var height: Double?
}

@available(iOS 16.0, tvOS 16.0, *)
private func parsePresentationDetent(_ detent: Either<PresentationDetentPreset, PresentationDetentItem>) -> PresentationDetent? {
  if let preset: PresentationDetentPreset = detent.get() {
    switch preset {
    case .medium:
      return .medium
    case .large:
      return .large
    }
  }

  if let item: PresentationDetentItem = detent.get() {
    if let fraction = item.fraction {
      return .fraction(CGFloat(fraction))
    }
    if let height = item.height {
      return .height(CGFloat(height))
    }
  }

  return nil
}

internal struct PresentationDetentsModifier: ViewModifier, Record {
  @Field var detents: [Either<PresentationDetentPreset, PresentationDetentItem>]?

  @available(iOS 16.0, tvOS 16.0, *)
  private func parseDetents() -> Set<PresentationDetent> {
    guard let detents, !detents.isEmpty else {
      return [.large]
    }

    var result: Set<PresentationDetent> = []
    for detent in detents {
      if let parsed = parsePresentationDetent(detent) {
        result.insert(parsed)
      }
    }
    return result.isEmpty ? [.large] : result
  }

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.presentationDetents(parseDetents())
    } else {
      content
    }
  }
}

// MARK: - Presentation Drag Indicator

internal enum PresentationDragIndicatorVisibilityModifier: String, Enumerable {
  case automatic
  case visible
  case hidden

  func toVisibility() -> Visibility {
    switch self {
    case .visible:
      return .visible
    case .hidden:
      return .hidden
    default:
      return .automatic
    }
  }
}

internal struct PresentationDragIndicatorModifier: ViewModifier, Record {
  @Field var visibility: PresentationDragIndicatorVisibilityModifier = .automatic

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.presentationDragIndicator(visibility.toVisibility())
    } else {
      content
    }
  }
}

// MARK: - Presentation Background Interaction

internal enum PresentationBackgroundInteractionTypeModifier: String, Enumerable {
  case automatic
  case enabled
  case disabled
  case enabledUpThrough
}

internal struct PresentationBackgroundInteractionModifier: ViewModifier, Record {
  @Field var interactionType: PresentationBackgroundInteractionTypeModifier = .automatic
  @Field var detent: Either<PresentationDetentPreset, PresentationDetentItem>?

  func body(content: Content) -> some View {
    if #available(iOS 16.4, tvOS 16.4, *) {
      switch interactionType {
      case .automatic:
        content.presentationBackgroundInteraction(.automatic)
      case .enabled:
        content.presentationBackgroundInteraction(.enabled)
      case .disabled:
        content.presentationBackgroundInteraction(.disabled)
      case .enabledUpThrough:
        if let detent, let parsed = parsePresentationDetent(detent) {
          content.presentationBackgroundInteraction(.enabled(upThrough: parsed))
        } else {
          content.presentationBackgroundInteraction(.enabled)
        }
      }
    } else {
      content
    }
  }
}

// MARK: - Interactive Dismiss Disabled

internal struct InteractiveDismissDisabledModifier: ViewModifier, Record {
  @Field var isDisabled: Bool = true

  func body(content: Content) -> some View {
    content.interactiveDismissDisabled(isDisabled)
  }
}
