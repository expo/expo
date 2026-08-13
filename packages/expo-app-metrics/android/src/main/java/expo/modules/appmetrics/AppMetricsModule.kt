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
import expo.modules.appmetrics.networkrequests.NetworkSpansConfiguration
import expo.modules.appmetrics.spans.SpanHandle
import expo.modules.appmetrics.spans.SpanRecorder
import expo.modules.appmetrics.storage.Span
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
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

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
   * The span producer installed on the monitor in `OnCreate`, kept so `setNetworkSpansConfig`
   * can apply a new recording policy to the live instance and `OnDestroy` can uninstall it
   * when the module is torn down (a JS reload).
   */
  private var networkRequestPersistence: NetworkRequestPersistence? = null

  // Lazy-initialized metadata - created once when first needed
  /**
   * Inserts a completed span row on the module scope. Awaiting the session row first keeps the
   * FK satisfied even for a span ended before the eager session persist finished. Failures are
   * logged and swallowed — recording telemetry must never break the caller.
   */
  private fun insertSpanRow(row: Span) {
    scope.launch {
      try {
        mainSession.awaitSessionPersisted()
        MetricsDatabase.getDatabase(context).spanDao().insertCapped(row)
      } catch (e: Exception) {
        Log.w("ExpoAppMetrics", "Failed to persist span \"${row.name}\"", e)
      }
    }
  }

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
          saveStartupMetricsIfNotSaved()
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
          saveStartupMetricsIfNotSaved()
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
        val recorder = SpanRecorder(
          name = validatedSpanName(name),
          sessionId = mainSession.sessionId,
          parentTraceId = parent?.recorder?.traceId,
          parentSpanId = parent?.recorder?.spanId,
          attributes = options?.attributes,
          startTimestampMs = options?.startTime?.toLong() ?: TimeUtils.getWallClockMillis()
        )
        SpanHandle(recorder = recorder, onEnd = ::insertSpanRow)
      }

      Function("recordSpan") { name: String, options: RecordSpanOptions ->
        val startTime = options.startTime ?: throw MissingSpanWindowException()
        val endTime = options.endTime ?: throw MissingSpanWindowException()
        // One code path with `startSpan`: an ephemeral recorder validates the attributes and
        // produces the same write-once row shape.
        val recorder = SpanRecorder(
          name = validatedSpanName(name),
          sessionId = mainSession.sessionId,
          attributes = options.attributes,
          startTimestampMs = startTime.toLong()
        )
        recorder.end(statusCode = null, statusMessage = null, endTimestampMs = endTime.toLong())?.let {
          insertSpanRow(it)
        }
      }

      Class("Span", SpanHandle::class) {
        Constructor { ->
          throw CodedException(
            "Span objects can't be constructed directly because a span's identity and session " +
              "attribution are assigned natively at start time. Get one from AppMetrics.startSpan() instead."
          )
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
            timeMs = options?.time?.toLong() ?: TimeUtils.getWallClockMillis()
          )
        }

        Function("end") { span: SpanHandle, options: SpanEndOptions? ->
          span.end(
            statusCode = spanStatusCode(options?.status),
            statusMessage = options?.message,
            endTimestampMs = options?.endTime?.toLong() ?: TimeUtils.getWallClockMillis()
          )
        }
      }

      Function("setNetworkSpansConfig") { config: NetworkSpansConfigParam ->
        val configuration = NetworkSpansConfiguration(
          enabled = config.enabled,
          hosts = config.filter?.hosts,
          methods = config.filter?.methods
        )
        // Persist first so the setting survives the process; the live producer picks it up for
        // every request recorded after the volatile write. Applies forward only — rows
        // persisted earlier in the launch still dispatch.
        AppMetricsPreferences.setNetworkSpansConfiguration(context, configuration)
        networkRequestPersistence?.setConfiguration(configuration)
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

        // Persist the session row eagerly so it's visible to readers
        // (`getMainSession`, …) as soon as possible. Idempotent:
        // a racing write triggers (and joins) the same single start job.
        scope.launch { mainSession.awaitSessionPersisted() }

        // From here on every completed request is written to the `spans` table, attributed to
        // the main session. Awaiting the session row first keeps the FK satisfied for every
        // span insert; installation also drains requests buffered since process start.
        scope.launch {
          mainSession.awaitSessionPersisted()
          val persistence = NetworkRequestPersistence(
            database = MetricsDatabase.getDatabase(context),
            scope = scope,
            sessionId = mainSession.sessionId
          )
          networkRequestPersistence = persistence
          // The policy is read from preferences only after the reference above is visible:
          // a `setNetworkSpansConfig` call landing before this line has already persisted its
          // value and is picked up here; one landing after it hits the live setter instead.
          // Reading before the assignment would let a concurrent configure fall between the
          // read and the assignment and leave a stale policy until the next launch.
          persistence.setConfiguration(AppMetricsPreferences.getNetworkSpansConfiguration(context))
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
          ) { sessionId, origin, report ->
            attributeAndStoreCrashReport(
              sessionManager = sessionManager,
              currentSessionId = mainSession.sessionId,
              sessionId = sessionId,
              origin = origin,
              report = report
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
        scope.launch {
          saveStartupMetricsIfNotSaved()
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
          saveStartupMetricsIfNotSaved()
          mainSession.addMetrics(listOf(metric))
        }
      }
    }
  }

  // Persists the collected startup metrics once, then suspends until that write
  // completes. The session waits for its row before inserting.
  internal suspend fun saveStartupMetricsIfNotSaved() = saveStartupMetricsJob.join()

  // Startup metrics are persisted on first access and exactly once: `by lazy`
  // runs the initializer a single time even across threads, so concurrent callers
  // don't each insert them.
  private val saveStartupMetricsJob: Job by lazy {
    scope.launch {
      mainSession.addMetrics(AppStartupManager.metrics)
    }
  }
}

@OptimizedRecord
data class MetricAttributes(
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record

/**
 * Payload of `setNetworkSpansConfig`: the normalized `traces.network` setting pushed down by
 * `Observe.configure`.
 */
@OptimizedRecord
data class NetworkSpansConfigParam(
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
  /** `"ok"` or `"error"`; anything else throws. Omitted means UNSET, per the conventions. */
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
 * Validates a caller-provided span name. The ingestion endpoint rejects spans whose name is
 * empty, so failing loudly at the call site beats silently recording a span the server drops.
 */
private fun validatedSpanName(name: String): String {
  val trimmed = name.trim()
  if (trimmed.isEmpty()) {
    throw CodedException(
      "A span needs a non-empty name because the server rejects nameless spans. " +
        "Pass a short, stable identifier for the operation being measured, like 'checkout' or 'image-decode'."
    )
  }
  return trimmed
}

/** Maps the JS `status` option to the OTLP status code. `null` stays UNSET. */
private fun spanStatusCode(status: String?): Int? = when (status) {
  null -> null
  "ok" -> Span.STATUS_OK
  "error" -> Span.STATUS_ERROR
  else -> throw CodedException(
    "'$status' is not a valid span status. Pass 'error' for a failed operation, 'ok' to " +
      "explicitly mark success, or omit the status to leave it unset (the usual choice for successful spans)."
  )
}

private class MissingSpanWindowException : CodedException(
  "recordSpan needs both startTime and endTime (unix-epoch milliseconds) because it records " +
    "an already-measured operation. To time an operation as it runs, use startSpan() and end() instead."
)
