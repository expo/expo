// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 JS-facing handle to a session, exposed as the `Session` class. Carries the native `Session`
 instance itself (live for the main session, hydrated from a database row for historical ones),
 so a JS reference keeps the native instance alive — no id registry needed.

 Mutable state (`isActive`, `endDate`) and children (metrics, logs, crash report) are read live
 from the database by the `Class("Session", …)` async methods, because a hydrated `Session` is a
 frozen projection of its row. `hasCrashReport` is the one extra snapshot field: it has no
 `Session` counterpart (it's a cross-row database aggregate) and exists so list UIs can render a
 crash badge without an async hop. It can go stale — a report attributed after the handle was
 captured won't flip it — but `getCrashReport()` always resolves live, so nothing is lost.
 */
final class SessionRef: SharedRef<Session> {
  let hasCrashReport: Bool

  override var nativeRefType: String {
    "session"
  }

  init(_ session: Session, hasCrashReport: Bool) {
    self.hasCrashReport = hasCrashReport
    super.init(session)
  }
}
