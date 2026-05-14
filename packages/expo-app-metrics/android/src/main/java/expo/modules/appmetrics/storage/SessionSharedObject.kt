package expo.modules.appmetrics.storage

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject

/**
 * JS-facing handle to a single session row. Metadata (`id`, `type`,
 * `startDate`, `endDate`) is loaded at construction time so synchronous
 * property reads from JS don't hit the database; metrics, logs, and the crash
 * report are fetched lazily through async functions on the shared object.
 *
 * Every session type uses this same shared-object shape. `getCrashReport` is
 * only meaningful on the main session; all other session types return `null`.
 */
class SessionSharedObject(
  appContext: AppContext,
  val id: String,
  val type: String,
  val startDate: String,
  val endDate: String?,
  val sessionManager: SessionManager
) : SharedObject(appContext)
