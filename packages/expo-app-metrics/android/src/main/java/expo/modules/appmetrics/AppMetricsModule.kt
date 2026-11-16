package expo.modules.appmetrics

import android.content.Context
import android.util.Log
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.jserrors.ErrorReport
import expo.modules.appmetrics.jserrors.PendingErrorStore
import expo.modules.appmetrics.jserrors.toLogRecord
import expo.modules.appmetrics.crashreporting.CrashFileReader
import expo.modules.appmetrics.crashreporting.CrashReportProcessor
import expo.modules.appmetrics.crashreporting.ExitInfoProviderImpl
import expo.modules.appmetrics.crashreporting.JvmCrashHandler
import expo.modules.appmetrics.crashreporting.PreferencesLastProcessedExitStore
import expo.modules.appmetrics.crashreporting.attributeAndStoreCrashReport
import expo.modules.appmetrics.logevents.LogEventOptions
import expo.modules.appmetrics.networkrequests.NetworkRequestFilter
import expo.modules.appmetrics.networkrequests.NetworkRequestMonitor
import expo.modules.appmetrics.networkrequests.NetworkRequestObserver
import expo.modules.appmetrics.networkrequests.NetworkRequestPersistence
import expo.modules.appmetrics.networkrequests.NetworkTracesConfiguration
import expo.modules.appmetrics.spans.SpanHandle
import expo.modules.appmetrics.spans.SpanRecorder
import expo.modules.appmetrics.spans.SpanWriter
import expo.modules.appmetrics.storage.Span
import expo.modules.appmetrics.logevents.MAX_EVENT_NAME_LENGTH
import expo.modules.appmetrics.logevents.RESERVED_EVENT_NAME_PREFIX
import expo.modules.appmetrics.logevents.Severity
import expo.modules.appmetrics.logevents.sanitizeLogEventAttributes
import expo.modules.appmetrics.logevents.validateDisplayName
import expo.modules.appmetrics.logevents.validateEventBody
import expo.modules.appmetrics.logevents.validateEventName
import expo.modules.appmetrics.logevents.withDisplayNameAttribute
import expo.modules.appmetrics.memory.MemoryMetricsManager
import expo.modules.appmetrics.storage.JsDebugSession
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.JsLogRecord
import expo.modules.appmetrics.storage.JsMetric
import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.storage.SessionMetricInput
import expo.modules.appmetrics.storage.SessionSharedObject
import expo.modules.appmetrics.updates.UpdatesMonitoring
import expo.modules.appmetrics.updates.UpdatesStateEvent
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesStateChangeListener
import expo.modules.updatesinterface.UpdatesStateChangeSubscription
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class AppMetricsModule : Module(), UpdatesStateChangeListener {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  // TODO(@lukmccall): Consider using appContext.backgroundCoroutineScope instead
  private val scope: CoroutineScope
    get() = appContext.modulesQueue

  lateinit var memoryMetricsManager: MemoryMetricsManager
  lateinit var updatesMonitoring: UpdatesMonitoring
  private var subscription: UpdatesStateChangeSubscription? = null

  lateinit var sessionManager: SessionManager

  lateinit var mainSession: SessionSharedObject

  /**
   * The span producer installed on the monitor in `OnCreate`, kept so `setNetworkTracesConfig`
   * can apply a new recording policy to the live instance and `OnDestroy` can uninstall it
   * when the module is torn down (a JS reload).
   */
  private var networkRequestPersistence: NetworkRequestPersistence? = null

  // Lazy-initialized metadata - created once when first needed
  /** The shared sink every span producer writes completed rows through. Set in `OnCreate`. */
  private lateinit var spanWriter: SpanWriter

  private val metadata: AppMetadata? by lazy {
    AppMetadataProvider.getAppMetadata(appContext.service<ConstantsInterface>(), context)
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoAppMetrics")

      Function("markFirstRender") {
        AppStartupManager.markFirstRender()
      }

      Function("markInteractive") { attributes: MetricAttributes? ->
        AppStartupManager.markInteractive(context, attributes?.routeName, attributes?.params)

        scope.launch {
          saveStartupMetrics()
        }
      }

      // TODO(@ubax): move `logEvent` onto the Session shared object so logs are recorded via a
      // session handle (like `addMetric`), instead of writing to `mainSession` directly here.
      Function("logEvent") { name: String, options: LogEventOptions? ->
        val validatedName = validateEventName(name) ?: return@Function
        val validatedBody = validateEventBody(options?.body)
        val sanitized = sanitizeLogEventAttributes(options?.attributes)
        val attributes = withDisplayNameAttribute(
          sanitized.attributes,
          validateDisplayName(options?.displayName)
        )
        val severity = options?.severity ?: Severity.INFO

        scope.launch {
          // Attach any pending startup metrics first so the session has them
          // alongside whatever's being logged. The session row itself is
          // already persisted eagerly in `OnCreate`, so this is purely about
          // ordering startup-metric writes ahead of caller-driven log events.
          saveStartupMetrics()
          // Globals merge happens inside `sessionManager.addLogs` so every
          // persistence path picks them up. The session waits for its row
          // before inserting.
          mainSession.addLogs(
            listOf(
              LogRecord(
                sessionId = mainSession.sessionId,
                timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
                name = validatedName,
                body = validatedBody,
                severity = severity.rawValue,
                attributes = attributes?.let { JsonAny.encodeMapToJsonString(it) },
                droppedAttributesCount = sanitized.droppedCount
              )
            )
          )
        }
      }

      Function("setGlobalAttributes") { attributes: Map<String, Any?>? ->
        GlobalAttributes.set(attributes)
      }

      Function("startSpan") { name: String, options: StartSpanOptions?, parent: SpanHandle? ->
        val validatedName = validatedSpanName(name)
        val recorder = SpanRecorder(
          name = validatedName ?: name,
          sessionId = mainSession.sessionId,
          parentTraceId = parent?.recorder?.traceId,
          parentSpanId = parent?.recorder?.spanId,
          attributes = options?.attributes,
          startTimestampMs = resolvedTimestamp(options?.startTime, "startTime")
        )
        // A span with an invalid name still works for the caller, including as a parent, but it
        // is never written.
        val onEnd: (Span) -> Unit = if (validatedName != null) {
          spanWriter::write
        } else {
          { _ -> }
        }
        SpanHandle(recorder = recorder, onEnd = onEnd)
      }

      Function("recordSpan") { name: String, options: RecordSpanOptions, parent: SpanHandle? ->
        val validatedName = validatedSpanName(name) ?: return@Function
        val (startTime, endTime) = recordedSpanWindow(options.startTime, options.endTime) ?: return@Function
        // One code path with `startSpan`: an ephemeral recorder validates the attributes and
        // produces the same write-once row shape.
        val recorder = SpanRecorder(
          name = validatedName,
          sessionId = mainSession.sessionId,
          parentTraceId = parent?.recorder?.traceId,
          parentSpanId = parent?.recorder?.spanId,
          attributes = options.attributes,
          startTimestampMs = startTime,
          attributeSource = "recordSpan"
        )
        recorder.end(statusCode = null, statusMessage = null, endTimestampMs = endTime)?.let {
          spanWriter.write(it)
        }
      }

      Class("Span", SpanHandle::class) {
        Constructor { ->
          throw SpanConstructorUnavailableException()
        }

        Property("traceId") { span: SpanHandle -> span.recorder.traceId }
        Property("spanId") { span: SpanHandle -> span.recorder.spanId }

        Function("setAttributes") { span: SpanHandle, attributes: Map<String, Any?> ->
          span.recorder.setAttributes(attributes)
        }

        Function("addEvent") { span: SpanHandle, name: String, options: SpanEventOptions? ->
          span.recorder.addEvent(
            name = name,
            attributes = options?.attributes,
            timeMs = resolvedTimestamp(options?.time, "time")
          )
        }

        Function("end") { span: SpanHandle, options: SpanEndOptions? ->
          span.end(
            statusCode = spanStatusCode(options?.status),
            statusMessage = options?.message,
            endTimestampMs = resolvedTimestamp(options?.endTime, "endTime")
          )
        }
      }

      Function("setNetworkTracesConfig") { config: NetworkTracesConfigParam ->
        val configuration = NetworkTracesConfiguration(
          enabled = config.enabled,
          hosts = config.filter?.hosts,
          methods = config.filter?.methods
        )
        // Persisted before the hop, so a configure racing startup is either read from
        // preferences by the installing producer or applied to the live one below.
        AppMetricsPreferences.setNetworkTracesConfiguration(context, configuration)
        scope.launch {
          // `modulesQueue` is a single thread fed from the JS thread, so rapid calls land in
          // order. iOS re-reads instead, because its actor hops carry no such guarantee.
          networkRequestPersistence?.setConfiguration(configuration)
        }
      }

      OnCreate {
        sessionManager = SessionManager(context)

        // The main session starts at the first startup metric's timestamp (the
        // earliest moment we have a record of), falling back to now when none
        // have been collected yet.
        val appSessionStartTimestamp =
          AppStartupManager.metrics.firstOrNull()?.timestamp ?: TimeUtils.getCurrentTimestampInISOFormat()

        mainSession = SessionSharedObject(
          sessionManager = sessionManager,
          scope = scope,
          type = "main",
          customStartTimestamp = appSessionStartTimestamp,
          metadata = metadata,
          runtime = appContext.runtime
        )

        JvmCrashHandler.currentSessionId = mainSession.sessionId

        spanWriter = SpanWriter(
          database = MetricsDatabase.getDatabase(context),
          scope = scope
        ) {
          mainSession.awaitSessionPersisted()
        }

        // Persist the session row eagerly so it's visible to readers
        // (`getMainSession`, …) as soon as possible. Idempotent:
        // a racing write triggers (and joins) the same single start job.
        scope.launch {
          mainSession.awaitSessionPersisted()
          // From here on every completed request is written to the `spans` table, attributed to
          // the main session. The await above keeps the FK satisfied for every span insert;
          // installation also drains requests buffered since process start.
          val persistence = NetworkRequestPersistence(
            writer = spanWriter,
            // Read here rather than left to the constructor default: recording is opt-in, so
            // without the persisted policy every span before the first `configure` is dropped.
            initialConfiguration = AppMetricsPreferences.getNetworkTracesConfiguration(context),
            sessionId = mainSession.sessionId
          )
          networkRequestPersistence = persistence
          NetworkRequestMonitor.shared.installPersistence(persistence)
        }

        // Sweep sessions orphaned by a previous process. The cutoff equals this
        // session's start and the comparison is strict (`<`), so this session
        // survives while older ones are swept — order vs the INSERT doesn't
        // matter. Relies on `<`, not `<=` (see SessionManagerTest).
        scope.launch { sessionManager.deactivateAllSessionsBefore(appSessionStartTimestamp) }

        // Turn the previous process's death evidence (pending JVM crash files,
        // OS exit records) into stored crash reports.
        // The processor builds the reports; `attributeAndStoreCrashReport` owns
        // the session attribution and storage.
        scope.launch {
          CrashReportProcessor(
            crashFileReader = CrashFileReader.forContext(context),
            exitInfoProvider = ExitInfoProviderImpl(context),
            lastProcessedExitStore = PreferencesLastProcessedExitStore(context),
            appVersion = metadata?.appVersion
          ) { sessionId, origin, report, logDetails ->
            attributeAndStoreCrashReport(
              sessionManager = sessionManager,
              currentSessionId = mainSession.sessionId,
              sessionId = sessionId,
              origin = origin,
              report = report,
              logDetails = logDetails
            )
          }.process()
        }

        memoryMetricsManager = MemoryMetricsManager(
          context = context,
          sessionManager = sessionManager
        )
        updatesMonitoring = UpdatesMonitoring(session = mainSession)
        updatesMonitoring.patchAppInfoIfNeeded(metadata)
        UpdatesControllerRegistry.controller?.get()?.let { controller ->
          subscription = controller.subscribeToUpdatesStateChanges(this@AppMetricsModule)
        }

        // Ingest fatal JS errors that a previous launch wrote to disk before terminating. Each is
        // attributed to the session it was captured in (recorded in the file), not the new session.
        // A session that never reached disk (crash before its row was inserted) makes the insert fail;
        // we swallow it and move on.
        // TODO(@ubax): move this drain and other resource-intensive startup work off the launch path
        // (e.g. into `markInteractive` or a background dispatch) so it doesn't affect startup time.
        scope.launch {
          PendingErrorStore.drain(context).forEach { pendingError ->
            runCatching {
              sessionManager.addLogs(listOf(pendingError.toLogRecord()), sessionId = pendingError.sessionId)
            }
          }
        }
      }

      OnActivityEntersBackground {
        // A pause skews startup timings, so stop recording and save what was recorded before.
        AppStartupManager.stopRecording()
        scope.launch {
          saveStartupMetrics()
        }
      }

      OnActivityDestroys {
        subscription?.remove()
      }

      OnDestroy {
        // Stop persisting spans for this module's session. Without this, a JS reload leaves
        // the old instance on the process-wide monitor, writing rows attributed to the
        // torn-down session until the next OnCreate replaces it.
        networkRequestPersistence?.let { NetworkRequestMonitor.shared.uninstallPersistence(it) }
        // `modulesQueue` is cancelled immediately after this hook returns, so
        // run the UPDATE on the calling thread to make sure the end timestamp
        // is persisted before teardown. `stop` awaits the session-start job
        // first, so the INSERT lands before the UPDATE and the stamp doesn't
        // silently no-op on a missing row.
        runBlocking {
          mainSession.stop()
        }
        // The session has ended; stop stamping it onto crashes. A crash after
        // this is captured as an orphan rather than misattributed
        if (JvmCrashHandler.currentSessionId == mainSession.sessionId) {
          JvmCrashHandler.currentSessionId = null
        }
      }

      // Debug-only: surfaces the inactive (ended) sessions for on-device
      // inspection (e.g. the ObserveTester app)
      AsyncFunction("getInactiveSessions") Coroutine { ->
        sessionManager.getInactiveSessions().map { JsDebugSession.fromSessionWithChildren(it) }
      }

      // Every stored crash report, newest first — attributed reports plus
      // orphans (startup crashes before the session existed, or native crashes
      // that couldn't be attributed). Orphans carry a null session id.
      AsyncFunction("getAllCrashReports") Coroutine { ->
        sessionManager.getAllCrashReports().mapNotNull { entity ->
          // `sessionId` lives on the DB row, not in the payload — merge it in so
          // callers can spot orphans (null session id).
          JsonAny.decodeJsonStringToMap(entity.payload)?.plus("sessionId" to entity.sessionId)
        }
      }

      AsyncFunction("takeMemoryUsageSnapshotAsync") Coroutine { sessionId: String? ->
        return@Coroutine memoryMetricsManager.takeMemorySnapshot(sessionId)
      }

      AsyncFunction("clearStoredEntries") Coroutine { -> sessionManager.clearAllData() }

      AsyncFunction("addCustomMetricToSession") Coroutine { metric: JsMetric ->
        sessionManager.addMetrics(listOf(metric.toMetric()), sessionId = metric.sessionId)
      }

      // Records an unhandled JavaScript error captured by the JS-side `global.ErrorUtils` handler as
      // a log event. The JS layer owns capture (and chaining to the previous handler).
      //
      // A fatal error terminates the process right after this returns, so we can't let the async
      // coroutine write race the shutdown. We write it to disk synchronously here (no coroutine, no
      // database) and ingest it on the next launch. Non-fatal errors aren't racing termination, so
      // they go through the normal async log path.
      Function("reportError") { report: ErrorReport ->
        if (report.isFatal) {
          PendingErrorStore.write(context, report.toPendingError(mainSession.sessionId))
        } else {
          scope.launch {
            mainSession.addLogs(listOf(report.toLogRecord(mainSession.sessionId)))
          }
        }
      }

      Function("getMainSession") {
        mainSession
      }

      // Android has no foreground-session tracking yet, so there's never a session to return.
      // Async to match the `Promise<Session | null>` JS contract.
      AsyncFunction("getForegroundSession") {
        null as SessionSharedObject?
      }

      Class(NetworkRequestObserver::class) {
        Constructor { filter: NetworkRequestFilter? ->
          NetworkRequestObserver(appContext, filter)
        }

        Function("setFilter") { observer: NetworkRequestObserver, filter: NetworkRequestFilter? ->
          observer.setFilter(filter)
        }
      }

      Class("Session", SessionSharedObject::class) {
        // TODO(@ubax): Allow for user session creation from JS
        Constructor { ->
          throw CodedException(
            "Session objects can't be created from JavaScript because sessions are opened and managed natively. " +
              "Get one from AppMetrics.getMainSession() or AppMetrics.getForegroundSession() instead."
          )
        }

        Property("id", SessionSharedObject::sessionId)
        Property("type", SessionSharedObject::type)
        Property("startDate", SessionSharedObject::startDate)

        AsyncFunction("isActive") Coroutine SessionSharedObject::isActive
        AsyncFunction("getEndDate") Coroutine SessionSharedObject::getEndDate

        AsyncFunction("getMetrics") Coroutine { ref: SessionSharedObject ->
          ref.getMetrics().map { JsMetric.fromMetric(it) }
        }

        AsyncFunction("getLogs") Coroutine { ref: SessionSharedObject ->
          ref.getLogs().map { JsLogRecord.fromLogRecord(it) }
        }

        AsyncFunction("addMetric") Coroutine { ref: SessionSharedObject, metric: SessionMetricInput ->
          ref.addMetrics(listOf(metric.toMetric(ref.sessionId)))
        }
      }
    }

  fun setEnvironment(environment: String) {
    AppMetricsPreferences.setEnvironment(context, environment)
    scope.launch {
      sessionManager.updateEnvironmentForActiveSessions(environment)
    }
  }

  override fun updatesStateDidChange(event: Map<String, Any>) {
    if (UpdatesStateEvent.fromMap(event)?.type == UpdatesStateEvent.EventType.DownloadCompleteWithUpdate) {
      updatesMonitoring.downloadTimeMetric(subscription)?.let { metric ->
        scope.launch {
          // Attach any pending startup metrics first so the download-time
          // metric lands alongside them. The session waits for its row before
          // inserting.
          saveStartupMetrics()
          mainSession.addMetrics(listOf(metric))
        }
      }
    }
  }

  // Persists the startup metrics recorded since the last save. The lock makes a concurrent
  // caller wait for an in-flight save, so its own write still lands after the startup metrics.
  // The session waits for its row before inserting.
  private suspend fun saveStartupMetrics() =
    saveStartupMetricsMutex.withLock {
      val metrics = AppStartupManager.takeUnsavedMetrics()
      if (metrics.isNotEmpty()) {
        mainSession.addMetrics(metrics)
      }
    }

  private val saveStartupMetricsMutex = Mutex()
}

@OptimizedRecord
data class MetricAttributes(
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record

/**
 * Payload of `setNetworkTracesConfig`: the normalized `networkTraces` setting pushed down by
 * `Observe.configure`.
 */
@OptimizedRecord
data class NetworkTracesConfigParam(
  @Field val enabled: Boolean = true,
  @Field val filter: NetworkRequestFilter? = null
) : Record

@OptimizedRecord
data class StartSpanOptions(
  @Field val attributes: Map<String, Any?>? = null,
  /** Unix-epoch milliseconds overriding "now" as the span start. */
  @Field val startTime: Double? = null
) : Record

@OptimizedRecord
data class SpanEventOptions(
  @Field val attributes: Map<String, Any?>? = null,
  /** Unix-epoch milliseconds overriding "now" as the event time. */
  @Field val time: Double? = null
) : Record

@OptimizedRecord
data class SpanEndOptions(
  /**
   * `"ok"` or `"error"`. Omitted means UNSET, per the conventions; any other value warns and
   * also means UNSET.
   */
  @Field val status: String? = null,
  @Field val message: String? = null,
  /** Unix-epoch milliseconds overriding "now" as the span end. */
  @Field val endTime: Double? = null
) : Record

@OptimizedRecord
data class RecordSpanOptions(
  @Field val startTime: Double? = null,
  @Field val endTime: Double? = null,
  @Field val attributes: Map<String, Any?>? = null
) : Record

/**
 * The earliest timestamp accepted from JavaScript, 2001-09-09T01:46:40Z. A smaller value almost
 * always comes from the wrong clock or is in the wrong unit: `performance.now()` measures uptime,
 * and a timestamp in seconds is 1000 times too small.
 */
internal const val MIN_TIMESTAMP_MS = 1_000_000_000_000L

/**
 * How far past the current time a timestamp from JavaScript may be. A later value almost always
 * is in the wrong unit, such as microseconds.
 */
internal const val MAX_TIMESTAMP_AHEAD_MS = 24 * 60 * 60 * 1_000L

/**
 * Resolves a caller-supplied timestamp, falling back to now when it is missing or unusable.
 *
 * An unusable value warns rather than passing silently: substituting now would otherwise record
 * a plausible-looking span whose window the caller never chose.
 */
internal fun resolvedTimestamp(value: Double?, field: String): Long {
  if (value == null) {
    return TimeUtils.getWallClockMillis()
  }
  return unixMilliseconds(value) ?: run {
    Log.w(
      TAG,
      "[AppMetrics] Ignoring `$field`: $value is not a unix-epoch timestamp in milliseconds. " +
        "Values from `performance.now()` and timestamps in seconds or microseconds are common " +
        "causes. Using the current time instead; pass a value from `Date.now()`."
    )
    TimeUtils.getWallClockMillis()
  }
}

/**
 * Converts a required `recordSpan` timestamp. Returns null and warns when it is missing or
 * unusable, so the caller drops the span.
 */
internal fun requiredTimestamp(value: Double?, field: String): Long? {
  if (value == null) {
    Log.w(
      TAG,
      "[AppMetrics] recordSpan received no `$field`, so the span is not recorded. It needs both " +
        "startTime and endTime (unix-epoch milliseconds) because it records an already-measured " +
        "operation. To time an operation as it runs, use startSpan() and end() instead."
    )
    return null
  }
  return unixMilliseconds(value) ?: run {
    Log.w(
      TAG,
      "[AppMetrics] recordSpan received $value as `$field`, which is not a unix-epoch timestamp " +
        "in milliseconds, so the span is not recorded. Values from `performance.now()` and " +
        "timestamps in seconds or microseconds are common causes. Pass a value from `Date.now()`."
    )
    null
  }
}

/**
 * Unix-epoch milliseconds from a JS number, or null when the value can't be one: NaN, infinity,
 * a value before [MIN_TIMESTAMP_MS], or one more than [MAX_TIMESTAMP_AHEAD_MS] after [nowMs].
 */
internal fun unixMilliseconds(value: Double, nowMs: Long = TimeUtils.getWallClockMillis()): Long? {
  // `toLong()` saturates: NaN becomes 0 and a value past the `Long` range becomes its bound, so
  // every value outside the accepted window is rejected before converting.
  if (!value.isFinite()) {
    return null
  }
  if (value < MIN_TIMESTAMP_MS || value > nowMs + MAX_TIMESTAMP_AHEAD_MS) {
    return null
  }
  return value.toLong()
}

/**
 * The measured window of a `recordSpan` call. Returns null and warns when a time is missing or
 * unusable, or when the window ends before it starts, so the caller drops the span.
 */
internal fun recordedSpanWindow(startTime: Double?, endTime: Double?): Pair<Long, Long>? {
  val start = requiredTimestamp(startTime, "startTime") ?: return null
  val end = requiredTimestamp(endTime, "endTime") ?: return null
  if (end < start) {
    Log.w(
      TAG,
      "[AppMetrics] recordSpan received an endTime before its startTime, so the span is not " +
        "recorded. Check that both times come from `Date.now()` and are passed in the right order."
    )
    return null
  }
  return start to end
}

/**
 * Validates a caller-provided span name with the rules `validateEventName` applies to log events.
 * Returns null and warns when the name is invalid, so the caller doesn't record the span.
 */
internal fun validatedSpanName(name: String): String? {
  val trimmed = name.trim()
  if (trimmed.isEmpty()) {
    Log.w(
      TAG,
      "[AppMetrics] A span with an empty name is not recorded. Pass a short, stable identifier " +
        "for the operation being measured, like 'checkout' or 'image-decode'."
    )
    return null
  }
  if (trimmed.startsWith(RESERVED_EVENT_NAME_PREFIX)) {
    Log.w(
      TAG,
      "[AppMetrics] The span `$trimmed` is not recorded because the `expo.` prefix is reserved " +
        "for spans the SDK records, like network requests. Pick a name from your own namespace, " +
        "like 'checkout' or 'image-decode'."
    )
    return null
  }
  if (trimmed.length > MAX_EVENT_NAME_LENGTH) {
    Log.w(
      TAG,
      "[AppMetrics] A span with a ${trimmed.length}-character name is not recorded because the " +
        "limit is $MAX_EVENT_NAME_LENGTH characters. Use a short, stable identifier and move the " +
        "variable details into attributes."
    )
    return null
  }
  return trimmed
}

/**
 * Maps the JS `status` option to the OTLP status code. `null` stays UNSET, and an unknown value
 * warns and stays UNSET too.
 */
internal fun spanStatusCode(status: String?): Int? = when (status) {
  null -> null
  "ok" -> Span.STATUS_OK
  "error" -> Span.STATUS_ERROR
  else -> {
    Log.w(
      TAG,
      "[AppMetrics] Ignoring the span status '$status', so the span ends with an unset status. " +
        "Pass 'error' for a failed operation, 'ok' to explicitly mark success, or omit the status."
    )
    null
  }
}

private class SpanConstructorUnavailableException : CodedException(
  "Span objects can't be constructed directly because a span's identity and session " +
    "attribution are assigned natively at start time. Get one from AppMetrics.startSpan() instead."
)
