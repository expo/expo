// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

private let iso8601Lock = NSLock()
private let iso8601WithFractionalSeconds: ISO8601DateFormatter = {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  return formatter
}()
private let iso8601WithoutFractionalSeconds: ISO8601DateFormatter = {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime]
  return formatter
}()

/// Tries fractional seconds first, then falls back without them, since callers may see either.
/// `ISO8601DateFormatter` is not safe for concurrent use, so parsing is serialized behind a lock.
func parseISO8601Date(_ value: String) -> Date? {
  iso8601Lock.lock()
  defer { iso8601Lock.unlock() }
  return iso8601WithFractionalSeconds.date(from: value) ?? iso8601WithoutFractionalSeconds.date(from: value)
}
