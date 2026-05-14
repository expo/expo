// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore


// JS-facing handle to a single session. 
// `SessionSharedObject`: metadata is captured at construction time so synchronous
// property reads from JS don't bounce through the actor, while metrics, logs, and
// the crash report are fetched lazily through the registered async functions.
public final class SessionSharedObject: SharedObject {
  public let id: String
  public let type: String
  public let startDate: String
  public let endDate: String?

  init(_ row: SessionRow) {
    self.id = row.id
    self.type = row.type
    self.startDate = row.startTimestamp
    self.endDate = row.endTimestamp
    super.init()
  }
}
