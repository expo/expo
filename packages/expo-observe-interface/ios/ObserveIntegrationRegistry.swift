// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// The part of expo-observe that runs the integrations.
public protocol ObserveIntegrationHost: AnyObject, Sendable {
  func register(_ integration: any ObserveIntegration)
}

/// Collects the native integrations of libraries, so a library can register its integration without a dependency on
/// expo-observe. When expo-observe is installed, it sets itself as the host and runs the integrations. Otherwise the
/// integrations never start.
public final class ObserveIntegrationRegistry: @unchecked Sendable {
  public static let shared = ObserveIntegrationRegistry()

  private let lock = NSLock()
  private var integrations: [any ObserveIntegration] = []
  private var host: (any ObserveIntegrationHost)?

  init() {}

  /// Registers an integration. Call it once per process, as early as possible, for example from an app delegate
  /// subscriber, so the integration can start at launch. It can be called from any thread.
  public func register(_ integration: any ObserveIntegration) {
    let host = lock.withLock {
      integrations.append(integration)
      return self.host
    }
    // Outside the lock, because the host can set up the integration, and a setup can register another integration.
    host?.register(integration)
  }

  /// Passes the integrations registered so far, and every later one, to `host`. Only expo-observe calls it.
  public func setHost(_ host: any ObserveIntegrationHost) {
    let integrations = lock.withLock {
      self.host = host
      return self.integrations
    }
    for integration in integrations {
      host.register(integration)
    }
  }
}
