// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Patterns that match attribute keys reserved by the SDK. Caller-provided
 attributes whose key matches any of these are dropped:

 - The `expo.*` namespace, owned entirely by the SDK (e.g. `expo.app.name`,
   `expo.eas_client.id`).
 - Specific OTel Semantic Convention keys the SDK sets on every record
   (e.g. `session.id`, `event.name`). Letting callers set these would
   produce duplicate-attribute errors on the collector.

 `Regex<Substring>` isn't Sendable, but the values are constructed once and
 never mutated, so sharing them across isolation domains is safe — hence
 `nonisolated(unsafe)`.
 */
nonisolated(unsafe) private let reservedAttributePatterns: [Regex<Substring>] = [
  /^expo\..+/,
  /^session\.id$/,
  /^event\.name$/
]

/**
 Maximum number of attributes accepted per log record. Mirrors the OTel SDK
 default — collectors and backends start to push back well before this limit,
 so we cap eagerly and surface the overflow via `droppedAttributesCount`.
 */
private let maxAttributeCount = 128

/**
 Result of sanitizing caller-provided log-event attributes.

 - `attributes`: the attributes that survived validation, or `nil` when the
   input was `nil` or every entry was dropped.
 - `droppedCount`: number of attributes that were dropped during validation.
   Surfaced on the OTel wire as `droppedAttributesCount` so backends know the
   record was filtered.
 */
struct SanitizedLogAttributes {
  let attributes: [String: Any]?
  let droppedCount: Int
}

/**
 Filters caller-provided log-event attributes. Drops:

 - keys that are empty after trimming whitespace,
 - keys under the reserved `expo.*` namespace or matching SDK-set keys,
 - everything past the per-record attribute count cap.

 Each rule warns with its own message so the developer can tell at a glance
 which rule fired.
 */
func sanitizeLogEventAttributes(_ attributes: [String: Any]?) -> SanitizedLogAttributes {
  guard let attributes else {
    return SanitizedLogAttributes(attributes: nil, droppedCount: 0)
  }
  var sanitized: [String: Any] = [:]
  var emptyKeyDrops = 0
  var reservedKeyDrops: [String] = []

  for (key, value) in attributes {
    let trimmedKey = key.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmedKey.isEmpty {
      emptyKeyDrops += 1
      continue
    }
    if reservedAttributePatterns.contains(where: { trimmedKey.wholeMatch(of: $0) != nil }) {
      reservedKeyDrops.append(key)
      continue
    }
    sanitized[trimmedKey] = value
  }

  // Apply the per-record cap last so the count reflects every other rule first.
  // Sort by key for a stable choice of which entries survive the cap; otherwise
  // dictionary iteration order would make this nondeterministic. Note this
  // biases retention toward alphabetically-earlier keys when the cap is hit —
  // acceptable for accidental-overflow cases (loop bug, typo); a caller that
  // genuinely needs >128 attributes should split them across multiple events.
  var overflowDrops = 0
  if sanitized.count > maxAttributeCount {
    let kept = sanitized.keys.sorted().prefix(maxAttributeCount)
    let keptSet = Set(kept)
    overflowDrops = sanitized.count - maxAttributeCount
    sanitized = sanitized.filter { keptSet.contains($0.key) }
  }

  if emptyKeyDrops > 0 {
    logger.warn(
      "[AppMetrics] logEvent dropped \(emptyKeyDrops) attribute(s) with empty or whitespace-only keys."
    )
  }
  if !reservedKeyDrops.isEmpty {
    let formattedKeys = reservedKeyDrops.sorted().map { "`\($0)`" }.joined(separator: ", ")
    logger.warn(
      "[AppMetrics] logEvent dropped attributes that overlap SDK-set keys or use the reserved `expo.` namespace: \(formattedKeys)."
    )
  }
  if overflowDrops > 0 {
    logger.warn(
      "[AppMetrics] logEvent dropped \(overflowDrops) attribute(s) past the \(maxAttributeCount)-attribute per-record cap."
    )
  }

  return SanitizedLogAttributes(
    attributes: sanitized.isEmpty ? nil : sanitized,
    droppedCount: emptyKeyDrops + reservedKeyDrops.count + overflowDrops
  )
}
