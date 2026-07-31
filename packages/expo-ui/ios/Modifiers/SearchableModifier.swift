// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SearchablePlacementKind: String, Enumerable {
  case automatic
  case toolbar
  case toolbarPrincipal
  case sidebar
  case navigationBarDrawer
}

internal enum SearchableNavigationBarDrawerDisplayMode: String, Enumerable {
  case automatic
  case always

#if !os(tvOS)
  func toSwiftUI() -> SearchFieldPlacement.NavigationBarDrawerDisplayMode {
    switch self {
    case .automatic:
      return .automatic
    case .always:
      return .always
    }
  }
#endif
}

internal struct SearchablePlacement: Record {
  @Field var kind: SearchablePlacementKind = .automatic
  @Field var displayMode: SearchableNavigationBarDrawerDisplayMode?

  func toSwiftUI() -> SearchFieldPlacement {
#if os(tvOS)
    return .automatic
#else
    switch kind {
    case .automatic:
      return .automatic
    case .toolbar:
      return .toolbar
    case .toolbarPrincipal:
      return .toolbarPrincipal
    case .sidebar:
      return .sidebar
    case .navigationBarDrawer:
      if let displayMode {
        return .navigationBarDrawer(displayMode: displayMode.toSwiftUI())
      }
      return .navigationBarDrawer
    }
#endif
  }
}

internal struct SearchableModifier: ViewModifier, Record {
  @Field var text: ObservableState?
  @Field var placement: SearchablePlacement?
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
  let placement: SearchablePlacement?
  let prompt: String?
  let eventDispatcher: EventDispatcher?
  @ViewBuilder let content: () -> C

  @ViewBuilder
  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      NavigationStack {
        searchableContent
      }
    } else {
      NavigationView {
        searchableContent
      }
      .navigationViewStyle(.stack)
    }
  }

  @ViewBuilder
  private var searchableContent: some View {
    let text = state.binding("")
    let resolvedPlacement = placement?.toSwiftUI() ?? .automatic

    if let prompt {
      content()
        .searchable(text: text, placement: resolvedPlacement, prompt: Text(prompt))
        .onChange(of: state.value as? String) { newValue in
          eventDispatcher?(["searchable": ["text": newValue ?? ""]])
        }
    } else {
      content()
        .searchable(text: text, placement: resolvedPlacement)
        .onChange(of: state.value as? String) { newValue in
          eventDispatcher?(["searchable": ["text": newValue ?? ""]])
        }
    }
  }
}
