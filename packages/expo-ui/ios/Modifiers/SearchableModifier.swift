// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SearchFieldPlacementType: String, Enumerable {
  case automatic
  case toolbar
  case sidebar
  case navigationBarDrawer

  var toSearchFieldPlacement: SearchFieldPlacement {
    switch self {
    case .automatic:
      return .automatic
    case .toolbar:
      return .toolbar
    case .sidebar:
#if os(tvOS)
      return .automatic
#else
      return .sidebar
#endif
    case .navigationBarDrawer:
#if os(iOS)
      return .navigationBarDrawer
#else
      return .automatic
#endif
    }
  }
}

internal struct SearchableModifier: ViewModifier, Record {
  @Field var text: ObservableState?
  @Field var placement: SearchFieldPlacementType = .automatic
  @Field var prompt: String?
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  @ViewBuilder
  func body(content: Content) -> some View {
    if let text {
      SearchableWrapper(
        state: text,
        placement: placement,
        prompt: prompt,
        eventDispatcher: eventDispatcher
      ) {
        content
      }
    } else {
      content
    }
  }
}

private struct SearchableWrapper<C: View>: View {
  @ObservedObject var state: ObservableState
  let placement: SearchFieldPlacementType
  let prompt: String?
  let eventDispatcher: EventDispatcher?
  @ViewBuilder let content: () -> C

  var body: some View {
    // The search field writes through the binding. Only report edits that come from the field,
    // so a value written from JavaScript does not bounce back as an event.
    let query = Binding<String>(
      get: { state.value as? String ?? "" },
      set: { newValue in
        guard newValue != state.value as? String else {
          return
        }
        state.value = newValue
        eventDispatcher?(["searchable": ["text": newValue]])
      }
    )
    if let prompt {
      content().searchable(text: query, placement: placement.toSearchFieldPlacement, prompt: prompt)
    } else {
      content().searchable(text: query, placement: placement.toSearchFieldPlacement)
    }
  }
}
