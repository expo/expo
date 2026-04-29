// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Prefix reserved for internal Expo attributes (e.g. `expo.app.name`,
 `expo.event.attributes`). Caller-provided attributes that start with this
 prefix are dropped to avoid shadowing or colliding with values populated by
 the SDK itself.
 */
private let reservedAttributePrefix = "expo."

/**
 Filters caller-provided log-event attributes, dropping any keys that fall
 under the reserved Expo namespace. A single warning is logged listing every
 rejected key so the developer can fix their call site without noise per key.

 Returns `nil` when the input is `nil` or no valid attributes remain.
 */
func sanitizeLogEventAttributes(_ attributes: [String: Any]?) -> [String: Any]? {
  guard let attributes else {
    return nil
  }
  var sanitized: [String: Any] = [:]
  var rejectedKeys: [String] = []

  for (key, value) in attributes {
    if key.hasPrefix(reservedAttributePrefix) {
      rejectedKeys.append(key)
      continue
    }
    sanitized[key] = value
  }

  if !rejectedKeys.isEmpty {
    let formattedKeys = rejectedKeys.sorted().map { "`\($0)`" }.joined(separator: ", ")
    logger.warn(
      "[AppMetrics] logEvent dropped attributes using the reserved `expo.` namespace: \(formattedKeys). " +
      "Pick a different attribute key — the `expo.` prefix is reserved for SDK-provided metadata."
    )
  }

  return sanitized.isEmpty ? nil : sanitized
}
