package expo.modules.appmetrics.sink

import expo.modules.appmetrics.crashreporting.CrashOrigin

/**
 * What the collector knows about the session a crash belongs to. For expo-observe. Not a stable API.
 */
data class CrashAttributionHint(
  // The session id stored in the crash file, if any.
  val sessionId: String?,
  val origin: CrashOrigin,
  // The live session, which a crash from a previous launch must never be attributed to.
  val currentSessionId: String?
)
