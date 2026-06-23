// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Outcome of a single dispatch attempt to the OTLP endpoint. Modeled after the OTLP retry
/// guidance: a 3-way classification distinguishes transient failures (retry the same batch)
/// from permanent ones (drop the batch and advance the cursor so it can't wedge the loop).
///
/// `retryable.retryAfter` carries the parsed `Retry-After` header value in seconds (or `nil`
/// when the server didn't supply one). `nonRetryable.reason` carries a short diagnostic string
/// for the `warn`-level log line.
internal enum DispatchResult: Equatable, Sendable {
  case success
  case retryable(retryAfter: TimeInterval?)
  case nonRetryable(reason: String)
}

extension Data {
  /// First ~512 bytes of the response body as UTF-8, for inclusion in error log lines. Bounded
  /// so a giant HTML error page doesn't flood the log; truncated mid-codepoint is acceptable
  /// for a diagnostic excerpt.
  fileprivate func bodyExcerpt(limit: Int = 512) -> String {
    let slice = self.prefix(limit)
    return String(data: slice, encoding: .utf8) ?? "<unreadable>"
  }
}

/// HTTP transport + response classification for `ObservabilityManager`. Lives in its own file
/// to keep `Observability.swift` focused on the dispatch lifecycle (cursors, batching, decide
/// whether to dispatch at all). All functions are pure / `nonisolated` so they can be
/// unit-tested without instantiating the manager or hitting the network.
internal enum DispatchUtils {
  /// POSTs the encoded `body` to `endpointUrl` and classifies the response. Catches both local
  /// encoding errors (non-retryable — same bytes will fail again) and transport errors (DNS,
  /// TLS, timeout, connection reset — retryable per OTLP).
  internal static func sendRequest(
    to endpointUrl: URL,
    body: any Encodable
  ) async -> DispatchResult {
    var request = URLRequest(url: endpointUrl)
    request.httpMethod = "POST"
    request.allHTTPHeaderFields = [
      "Content-Type": "application/json",
      // Tells `NetworkRequestURLProtocol` to skip observation so our own telemetry uploads don't
      // get logged back into the network-request stream. The header reaches o.expo.dev unchanged
      // (we control that endpoint, so the harmless overhead is fine). The name is duplicated here
      // rather than imported: expo-observe must not depend on expo-app-metrics internals. Keep it
      // in sync with `NetworkRequestURLProtocol.internalHeaderName` in expo-app-metrics.
      "Expo-AppMetrics-Skip": "1",
    ]
    do {
      request.httpBody = try body.toJSONData([])
    } catch {
      return .nonRetryable(reason: "encoding error: \(error.localizedDescription)")
    }

    #if DEBUG
    observeLogger.debug("[EAS Observe] Sending the request to \(endpointUrl) with body:")
    // Use `print` so the JSON can be copied without including the log level emojis. Wrapped in
    // `#if DEBUG` so release builds don't pay for a second pretty-printed encode of the payload.
    if let prettyBody = try? body.toJSONString(.prettyPrinted) {
      print(prettyBody)
    }
    #endif

    let responseData: Data
    let urlResponse: URLResponse
    do {
      (responseData, urlResponse) = try await URLSession.shared.data(for: request)
    } catch {
      observeLogger.warn(
        "[EAS Observe] Transport error talking to \(endpointUrl): \(error.localizedDescription)"
      )
      return .retryable(retryAfter: nil)
    }

    guard let urlResponse = urlResponse as? HTTPURLResponse else {
      // Non-HTTP response — exotic but not impossible (proxies). Treat as transient.
      return .retryable(retryAfter: nil)
    }

    let retryAfterHeader = urlResponse.value(forHTTPHeaderField: "Retry-After")
    let partialSuccess = try? JSONDecoder().decode(OTServiceResponse.self, from: responseData)
      .partialSuccess
    let result = classifyResponse(
      statusCode: urlResponse.statusCode,
      retryAfterHeader: retryAfterHeader,
      partialSuccess: partialSuccess,
      bodyExcerpt: { responseData.bodyExcerpt() }
    )

    switch result {
    case .success:
      observeLogger.debug(
        "[EAS Observe] Server responded successfully with \(urlResponse.statusCode) and data: "
          + "\(String(data: responseData, encoding: .utf8) ?? "<unreadable>")"
      )
    case .retryable:
      observeLogger.warn(
        "[EAS Observe] Server responded with \(urlResponse.statusCode) (retryable) and data: "
          + "\(String(data: responseData, encoding: .utf8) ?? "<unreadable>")"
      )
    case .nonRetryable(let reason):
      observeLogger.warn(
        "[EAS Observe] Server responded with \(urlResponse.statusCode) (non-retryable, "
          + "\(reason)) and data: \(String(data: responseData, encoding: .utf8) ?? "<unreadable>")"
      )
    }
    return result
  }

  /// Pure classifier that maps an HTTP response into one of three retry outcomes. Extracted
  /// from `sendRequest` so the OTLP-spec rules can be unit-tested without a real network call.
  ///
  /// `bodyExcerpt` is invoked lazily, only when the result is `.nonRetryable` and the reason
  /// string benefits from including a peek at the response body. Lets the caller bound how much
  /// data we slurp into the log line.
  internal static func classifyResponse(
    statusCode: Int,
    retryAfterHeader: String?,
    partialSuccess: OTPartialSuccess?,
    bodyExcerpt: () -> String = { "" }
  ) -> DispatchResult {
    let retryAfter = parseRetryAfter(retryAfterHeader)

    if (200...299).contains(statusCode) {
      // The OTLP spec also allows `partial_success` to carry a warning-only payload — rejected=0
      // with a non-empty `errorMessage`. Treat that as a successful send (the records DID land)
      // so we don't double-drop. The dispatch caller may still want to log the warning.
      if let partial = partialSuccess, partial.rejectedCount > 0 {
        let detail = partial.errorMessage ?? "no error message"
        return .nonRetryable(
          reason: "partial_success: rejected \(partial.rejectedCount) (\(detail))"
        )
      }
      return .success
    }

    // Retryable per OTLP. `408` lacks a real-world Retry-After in practice but the spec admits
    // it; carry the header through unchanged so server can override us.
    switch statusCode {
    case 408, 429, 502, 503, 504:
      return .retryable(retryAfter: retryAfter)
    default:
      let excerpt = bodyExcerpt()
      let suffix = excerpt.isEmpty ? "" : ": \(excerpt)"
      return .nonRetryable(reason: "HTTP \(statusCode)\(suffix)")
    }
  }

  /// Parses an HTTP `Retry-After` header into a delay in seconds from now. Accepts both
  /// formats permitted by RFC 7231: an integer delta-seconds, or an HTTP-date.
  /// Returns `nil` if the header is absent or unparseable.
  internal static func parseRetryAfter(_ header: String?) -> TimeInterval? {
    guard let raw = header?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
      return nil
    }
    if let seconds = TimeInterval(raw) {
      return max(seconds, 0)
    }
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
    if let date = formatter.date(from: raw) {
      return max(date.timeIntervalSinceNow, 0)
    }
    return nil
  }

  /// Computes the cursor value the dispatch loop should persist after a single dispatch attempt.
  ///
  /// - `.success` advances to `highestId` — the rows have been accepted by the server.
  /// - `.nonRetryable` ALSO advances to `highestId` — the server has refused these rows
  ///   permanently, so retrying would just produce the same answer; advancing the cursor drops
  ///   the batch so it can't wedge subsequent rounds. This is the acceptance-criterion behavior:
  ///   a 400/403 must not be re-sent on the next cycle.
  /// - `.retryable` leaves the cursor at its current value so the next dispatch attempt picks
  ///   the same rows up again.
  internal static func nextCursor(
    for result: DispatchResult,
    currentCursor: Int64,
    highestId: Int64
  ) -> Int64 {
    switch result {
    case .success, .nonRetryable:
      return highestId
    case .retryable:
      return currentCursor
    }
  }

  // MARK: - Retry gate + exponential backoff

  /// Base delay for the exponential backoff when the server doesn't supply a `Retry-After`.
  /// The cap (`backoffCapSeconds`) bounds the worst-case wait so we don't end up snoozing for
  /// hours after a long string of failures.
  internal static let backoffBaseSeconds: TimeInterval = 60
  internal static let backoffCapSeconds: TimeInterval = 900

  /// Computes a backoff delay for the next dispatch attempt when the server didn't supply
  /// `Retry-After`. Exponential growth (base × 2^(attempt-1)), capped, with full jitter so a
  /// fleet of devices recovering from the same transient backend outage doesn't thunder-herd
  /// the recovery.
  ///
  /// `attempt` is 1-based; the helper is defensive for `0` / negative inputs and returns 0
  /// rather than producing a negative exponent.
  internal static func computeBackoffDelay(
    attempt: Int,
    base: TimeInterval = backoffBaseSeconds,
    cap: TimeInterval = backoffCapSeconds,
    random: () -> Double = { Double.random(in: 0..<1) }
  ) -> TimeInterval {
    guard attempt >= 1 else { return 0 }
    let exponential = min(base * pow(2, Double(attempt - 1)), cap)
    return exponential * random()
  }

  /// Snapshot of the retry-gate state carried across dispatch rounds. `dispatchAfterDate` is the
  /// wall-clock deadline before which the dispatch entry point should short-circuit (set by a
  /// retryable response, naturally expires); `consecutiveRetryableFailures` is the counter that
  /// drives `computeBackoffDelay` when the server didn't supply a `Retry-After`.
  internal struct RetryGateState: Equatable {
    let dispatchAfterDate: Date?
    let consecutiveRetryableFailures: Int

    static let initial = RetryGateState(dispatchAfterDate: nil, consecutiveRetryableFailures: 0)
  }

  /// Pure helper that computes the next `RetryGateState` after a single dispatch result.
  ///
  /// - `.success` resets the counter to 0 and leaves the gate alone. The gate either already
  ///   expired (we wouldn't have dispatched otherwise) or was never set — either way, success
  ///   doesn't introduce a new pause.
  /// - `.nonRetryable` also resets the counter. A permanent drop isn't a sign that the server
  ///   is unhealthy and shouldn't pause subsequent rounds.
  /// - `.retryable` increments the counter and sets the gate to `now + delay`, where `delay`
  ///   is the server-supplied `Retry-After` if present, otherwise `backoff(nextCount)`.
  ///
  /// `backoff` is injected so tests can drive it deterministically without going through
  /// `computeBackoffDelay`'s `Double.random` source.
  internal static func nextRetryGateState(
    result: DispatchResult,
    currentState: RetryGateState,
    now: Date,
    backoff: (Int) -> TimeInterval
  ) -> RetryGateState {
    switch result {
    case .success, .nonRetryable:
      return RetryGateState(
        dispatchAfterDate: currentState.dispatchAfterDate,
        consecutiveRetryableFailures: 0
      )
    case .retryable(let retryAfter):
      let nextCount = currentState.consecutiveRetryableFailures + 1
      let delay = retryAfter ?? backoff(nextCount)
      return RetryGateState(
        dispatchAfterDate: now.addingTimeInterval(delay),
        consecutiveRetryableFailures: nextCount
      )
    }
  }
}
