// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Options accepted by the `logEvent` module function. The event name is
 passed as a separate positional argument and is therefore not part of this
 record.
 */
struct LogEventOptions: Record {
  @Field var body: String?
  @Field var attributes: [String: Any]?
  @Field var severity: Severity?
}
