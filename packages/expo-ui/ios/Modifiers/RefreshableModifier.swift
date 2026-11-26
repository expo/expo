// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 * Manages refresh operation continuations for the refreshable modifier.
 * This singleton stores continuations that are resumed when JavaScript signals completion.
 */
internal final class RefreshableManager {
  static let shared = RefreshableManager()

  private var continuations: [String: CheckedContinuation<Void, Never>] = [:]

  private init() {}

  func storeContinuation(_ continuation: CheckedContinuation<Void, Never>, for id: String) {
    DispatchQueue.main.async {
      self.continuations[id] = continuation
    }
  }

  func completeRefresh(id: String) {
    DispatchQueue.main.async {
      if let continuation = self.continuations.removeValue(forKey: id) {
        continuation.resume()
      }
    }
  }
}

internal struct RefreshableModifier: EventDispatchingViewModifier, Record {
  var eventDispatcher: EventDispatcher?
  @State private var currentRefreshId: String?

  init() {}

  func body(content: Content) -> some View {
    content
      .refreshable {
        await withCheckedContinuation { continuation in
          let refreshId = UUID().uuidString
          RefreshableManager.shared.storeContinuation(continuation, for: refreshId)
          currentRefreshId = refreshId
          eventDispatcher?(["refreshable": ["id": refreshId]])
        }
        currentRefreshId = nil
      }
      .onDisappear {
        if let refreshId = currentRefreshId {
          RefreshableManager.shared.completeRefresh(id: refreshId)
          currentRefreshId = nil
        }
      }
  }
}
