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
  @Field var selection: Either<PresentationDetentPreset, PresentationDetentItem>?
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

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
      if selection != nil || eventDispatcher != nil {
        PresentationDetentsSelectionView(
          detents: parseDetents(),
          rawDetents: detents ?? [],
          initialSelection: selection.flatMap { parsePresentationDetent($0) },
          eventDispatcher: eventDispatcher
        ) {
          content
        }
      } else {
        content.presentationDetents(parseDetents())
      }
    } else {
      content
    }
  }
}

@available(iOS 16.0, tvOS 16.0, *)
private func buildDetentSerializationMap(
  from rawDetents: [Either<PresentationDetentPreset, PresentationDetentItem>]
) -> [PresentationDetent: Any] {
  var map: [PresentationDetent: Any] = [:]
  for raw in rawDetents {
    if let parsed = parsePresentationDetent(raw) {
      if let preset: PresentationDetentPreset = raw.get() {
        map[parsed] = preset.rawValue
      } else if let item: PresentationDetentItem = raw.get() {
        if let fraction = item.fraction {
          map[parsed] = ["fraction": fraction]
        } else if let height = item.height {
          map[parsed] = ["height": height]
        }
      }
    }
  }
  return map
}

@available(iOS 16.0, tvOS 16.0, *)
private struct PresentationDetentsSelectionView<WrappedContent: View>: View {
  let detents: Set<PresentationDetent>
  let detentSerializationMap: [PresentationDetent: Any]
  let initialSelection: PresentationDetent?
  let eventDispatcher: EventDispatcher?
  let wrappedContent: WrappedContent

  @State private var selectedDetent: PresentationDetent

  init(
    detents: Set<PresentationDetent>,
    rawDetents: [Either<PresentationDetentPreset, PresentationDetentItem>],
    initialSelection: PresentationDetent?,
    eventDispatcher: EventDispatcher?,
    @ViewBuilder content: () -> WrappedContent
  ) {
    self.detents = detents
    self.detentSerializationMap = buildDetentSerializationMap(from: rawDetents)
    self.initialSelection = initialSelection
    self.eventDispatcher = eventDispatcher
    self.wrappedContent = content()
    self._selectedDetent = State(initialValue: initialSelection ?? detents.first ?? .large)
  }

  var body: some View {
    wrappedContent
      .presentationDetents(detents, selection: $selectedDetent)
      .onChange(of: selectedDetent) { newDetent in
        if let serialized = detentSerializationMap[newDetent] {
          eventDispatcher?(["presentationDetents": ["detent": serialized]])
        }
      }
      .onChange(of: initialSelection) { newSelection in
        if let newSelection {
          selectedDetent = newSelection
        }
      }
  }
}

// MARK: - Presentation Drag Indicator

internal struct PresentationDragIndicatorModifier: ViewModifier, Record {
  @Field var visibility: VisibilityOptions = .automatic

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
