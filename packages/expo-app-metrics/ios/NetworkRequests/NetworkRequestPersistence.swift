// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Records completed network requests as trace spans.
///
/// Mirrors the Android `NetworkRequestPersistence`.
@AppMetricsActor
final class NetworkRequestPersistence: Sendable {
  private let registry: MetricsSinkRegistry

  /// A closure so constructing this does not force the session machinery into existence before
  /// the app delegate finished wiring it.
  private let sessionId: @Sendable () -> String

  private var configuration: NetworkTracesConfiguration

  init(
    configuration: NetworkTracesConfiguration = NetworkTracesConfiguration(),
    registry: MetricsSinkRegistry = .shared,
    sessionId: @escaping @Sendable () -> String
  ) {
    self.configuration = configuration
    self.registry = registry
    self.sessionId = sessionId
  }

  /// Applies a new recording policy. Affects future requests only; rows already written stay.
  func setConfiguration(_ configuration: NetworkTracesConfiguration) {
    self.configuration = configuration
  }

  /// Records one completed request as a span.
  func persist(_ request: NetworkRequest) {
    guard configuration.allows(url: request.url, method: request.method) else {
      return
    }
    guard let span = NetworkSpan.from(request: request) else {
      return
    }
    do {
      try registry.record(spans: [span], sessionId: sessionId())
    } catch {
      // Swallowed: recording telemetry must never break the monitor's fan-out to its delegates.
      logger.warn("[AppMetrics] Failed to persist a network request span: \(error.localizedDescription)")
    }
  }
}
