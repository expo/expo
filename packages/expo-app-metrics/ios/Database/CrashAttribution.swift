// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension CrashReport {
  /// Picks the most likely main session that this crash report belongs to.
  ///
  /// MetricKit only gives us the diagnostic payload's time window (`timestampBegin` to
  /// `timestampEnd`, typically a 24-hour bucket), not an exact crash time. Xcode's
  /// "Simulate MetricKit Payloads" delivers a zero-width window where both timestamps
  /// equal "now," so we can't rely on the session's start time falling inside it.
  ///
  /// 1. Treat each session as the interval `[startDate, endDate ?? .distantFuture]` and
  /// pick sessions that intersect the payload window. Among those, prefer the one
  /// that never finished (`endDate == nil`) — an unfinished main session is a strong
  /// signal of a crash. Otherwise pick the intersecting session with the latest start time.
  /// 2. If nothing intersects *and* the window is zero-width (Xcode-simulated payloads
  /// where intersection is impossible by construction), fall back to the latest
  /// unfinished session overall, then to the latest session by start time.
  /// 3. Otherwise return `nil` — a real payload window that doesn't overlap any session
  /// is genuinely unattributable, and silently misattributing it to the current
  /// session would hide that.
  func findMatchingSession(in mainSessions: [SessionRow]) -> SessionRow? {
    let payloadBegin = timestampBegin.ISO8601Format()
    let payloadEnd = timestampEnd.ISO8601Format()
    let intersecting = mainSessions.filter { session in
      guard session.startTimestamp <= payloadEnd else {
        return false
      }
      // No end timestamp means the session is still active — it overlaps anything in its future.
      guard let sessionEnd = session.endTimestamp else {
        return true
      }
      return sessionEnd >= payloadBegin
    }
    let candidates: [SessionRow]
    if !intersecting.isEmpty {
      candidates = intersecting
    } else if timestampBegin == timestampEnd {
      candidates = mainSessions
    } else {
      return nil
    }
    let unfinished = candidates.filter({ $0.endTimestamp == nil })
    if let session = unfinished.max(by: { $0.startTimestamp < $1.startTimestamp }) {
      return session
    }
    return candidates.max(by: { $0.startTimestamp < $1.startTimestamp })
  }
}
