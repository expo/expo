package expo.modules.appmetrics.storage

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject

/**
 * Native backing for the JS `Session` class. Holds an immutable snapshot of the
 * eager session fields; mutable state (`isActive`/`endDate`) and
 * metrics/logs/crash-report reads are performed lazily by the module's
 * `Class("Session", …)` functions so they reflect live state and are only paid
 * for when JS actually asks.
 *
 * Only the [sessionId] and the snapshot scalars are captured — never a
 * `SessionManager`, Activity, or React context — so a retained `Session`
 * reference can't outlive and leak the host. [SharedObject] keeps a weak handle
 * to the runtime on its own.
 */
class SessionSharedObject(
  val sessionId: String,
  val type: String,
  val startDate: String,
  // Always false on Android: crash reports are an iOS-only MetricKit feature.
  val hasCrashReport: Boolean,
  appContext: AppContext
) : SharedObject(appContext)
