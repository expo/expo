package expo.modules.appmetrics.crashreporting

import android.util.Log
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.storage.SessionManager

/**
 * Attributes a crash report to a session and persists it. Failures are logged and
 * swallowed so a bad report can't crash the next launch.
 */
suspend fun attributeAndStoreCrashReport(
  sessionManager: SessionManager,
  currentSessionId: String?,
  sessionId: String?,
  origin: CrashOrigin,
  report: CrashReport
) {
  runCatching {
    // A null target stores the report as an orphan.
    val target: String? = when {
      // JVM file with a real session id → stored under that id. 
      sessionId != null -> sessionId.takeIf { sessionManager.getSessionRow(it) != null }
      // Native crash (exit record) → attributed to the previous main session,
      // unless that session already has a crash report, in which case it's stored
      // as an orphan so the existing report isn't overwritten.
      origin == CrashOrigin.EXIT_RECORD ->
        sessionManager.getPreviousMainSessionId(currentSessionId)
          ?.takeIf { sessionManager.getCrashReport(it) == null }
      // id-less JVM file (a crash before the main session existed) → orphan.
      else -> null
    }
    sessionManager.setCrashReport(target, report.encodeToJsonString())
  }.onFailure {
    Log.e(TAG, "Failed to persist a crash report", it)
  }
}
