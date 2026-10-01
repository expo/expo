package expo.modules.appmetrics

import android.content.Context
import android.util.Log
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.jserrors.ErrorReport
import expo.modules.appmetrics.jserrors.PendingErrorStore
import expo.modules.appmetrics.jserrors.toLogEvent
import expo.modules.appmetrics.crashreporting.CrashFileReader
import expo.modules.appmetrics.crashreporting.CrashReportProcessor
import expo.modules.appmetrics.crashreporting.ExitInfoProviderImpl
import expo.modules.appmetrics.crashreporting.JvmCrashHandler
import expo.modules.appmetrics.crashreporting.PreferencesLastProcessedExitStore
import expo.modules.appmetrics.logevents.LogEventOptions
import expo.modules.appmetrics.networkrequests.NetworkRequestFilter
import expo.modules.appmetrics.networkrequests.NetworkRequestMonitor
import expo.modules.appmetrics.networkrequests.NetworkRequestObserver
import expo.modules.appmetrics.networkrequests.NetworkRequestPersistence
import expo.modules.appmetrics.networkrequests.NetworkTracesConfiguration
import expo.modules.appmetrics.logevents.Severity
import expo.modules.appmetrics.logevents.sanitizeLogEventAttributes
import expo.modules.appmetrics.logevents.validateDisplayName
import expo.modules.appmetrics.logevents.validateEventBody
import expo.modules.appmetrics.logevents.validateEventName
import expo.modules.appmetrics.logevents.withDisplayNameAttribute
import expo.modules.appmetrics.memory.MemoryMetricsManager
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.sessions.JsMetric
import expo.modules.appmetrics.sessions.SessionMetricInput
import expo.modules.appmetrics.sessions.SessionSharedObject
import expo.modules.appmetrics.sink.CrashAttributionHint
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.appmetrics.storage.DatabaseMetricsSink
import expo.modules.appmetrics.storage.SessionManager
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
   * The span producer installed on the monitor in `OnCreate`, kept so `setNetworkTracesConfig`
   * can apply a new recording policy to the live instance and `OnDestroy` can uninstall it
   * when the module is torn down (a JS reload).
   */
  private var networkRequestPersistence: NetworkRequestPersistence? = null

  // Lazy-initialized metadata - created once when first needed
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
          // alongside whatever's being logged. The session itself is started
          // in `OnCreate`, so this is purely about ordering startup-metric
          // writes ahead of caller-driven log events.
          saveStartupMetricsIfNotSaved()
          // Globals merge happens in `MetricsSinkRegistry` so every record
          // picks them up.
          mainSession.addLogs(
            listOf(
              LogEvent(
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
        MetricsSinkRegistry.register(DatabaseMetricsSink.getInstance(context))
        sessionManager = SessionManager(context)

        // The main session starts at the first startup metric's timestamp (the
        // earliest moment we have a record of), falling back to now when none
        // have been collected yet.
        val appSessionStartTimestamp =
          AppStartupManager.metrics.firstOrNull()?.timestamp ?: TimeUtils.getCurrentTimestampInISOFormat()

        mainSession = SessionSharedObject(
          type = "main",
          customStartTimestamp = appSessionStartTimestamp,
          metadata = metadata,
          runtime = appContext.runtime
        )

        JvmCrashHandler.currentSessionId = mainSession.sessionId

        // The sink orders every later record of this session after its start.
        mainSession.start()

        scope.launch {
          // From here on every completed request is recorded as a span of the main session.
          // Installation also drains requests buffered since process start.
          val persistence = NetworkRequestPersistence(
            scope = scope,
            initialConfiguration = AppMetricsPreferences.getNetworkTracesConfiguration(context),
            sessionId = mainSession.sessionId
          )
          networkRequestPersistence = persistence
          NetworkRequestMonitor.shared.installPersistence(persistence)
        }

        // Turn the previous process's death evidence (pending JVM crash files,
        // OS exit records) into crash reports.
        // The processor builds the reports; the sink owns the session
        // attribution and storage.
        scope.launch {
          CrashReportProcessor(
            crashFileReader = CrashFileReader.forContext(context),
            exitInfoProvider = ExitInfoProviderImpl(context),
            lastProcessedExitStore = PreferencesLastProcessedExitStore(context),
            appVersion = metadata?.appVersion
          ) { sessionId, origin, report, logDetails ->
            // A bad report must not stop the processor from deleting its file or crash the app.
            runCatching {
              MetricsSinkRegistry.shared.recordCrash(
                report,
                report.toLogEvent(logDetails),
                CrashAttributionHint(sessionId, origin, mainSession.sessionId)
              )
            }.onFailure {
              Log.e(TAG, "Failed to persist a crash report", it)
            }
          }.process()
        }

        memoryMetricsManager = MemoryMetricsManager(context)
        updatesMonitoring = UpdatesMonitoring()
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
              MetricsSinkRegistry.shared.recordLogs(listOf(pendingError.toLogEvent()), pendingError.sessionId)
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
        // end the session on the calling thread to make sure the end timestamp
        // is persisted before teardown. The sink waits for the session start
        // first, so the end stamp doesn't silently no-op on a missing row.
        runBlocking {
          mainSession.stop()
        }
        // The session has ended; stop stamping it onto crashes. A crash after
        // this is captured as an orphan rather than misattributed
        if (JvmCrashHandler.currentSessionId == mainSession.sessionId) {
          JvmCrashHandler.currentSessionId = null
        }
      }

      AsyncFunction("takeMemoryUsageSnapshotAsync") Coroutine { sessionId: String? ->
        return@Coroutine memoryMetricsManager.takeMemorySnapshot(sessionId)
      }

      AsyncFunction("addCustomMetricToSession") Coroutine { metric: JsMetric ->
        MetricsSinkRegistry.shared.recordMetrics(listOf(metric.toMetric()), metric.sessionId)
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
            mainSession.addLogs(listOf(report.toLogEvent()))
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

        AsyncFunction("isActive") { session: SessionSharedObject -> session.isActive() }
        AsyncFunction("getEndDate") { session: SessionSharedObject -> session.getEndDate() }

        AsyncFunction("addMetric") Coroutine { ref: SessionSharedObject, metric: SessionMetricInput ->
          ref.addMetrics(listOf(metric.toMetric()))
        }
      }
    }

  fun setEnvironment(environment: String) {
    AppMetricsPreferences.setEnvironment(context, environment)
    scope.launch {
      DatabaseMetricsSink.getInstance(context).updateEnvironmentForActiveSessions(environment)
    }
  }

  override fun updatesStateDidChange(event: Map<String, Any>) {
    if (UpdatesStateEvent.fromMap(event)?.type == UpdatesStateEvent.EventType.DownloadCompleteWithUpdate) {
      updatesMonitoring.downloadTimeMetric(subscription)?.let { metric ->
        scope.launch {
          // Attach any pending startup metrics first so the download-time
          // metric lands alongside them.
          saveStartupMetricsIfNotSaved()
          mainSession.addMetrics(listOf(metric))
        }
      }
    }
  }

  // Persists the collected startup metrics once, then suspends until that write
  // completes.
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
 * Payload of `setNetworkTracesConfig`: the normalized `networkTraces` setting pushed down by
 * `Observe.configure`.
 */
@OptimizedRecord
data class NetworkTracesConfigParam(
  @Field val enabled: Boolean = true,
  @Field val filter: NetworkRequestFilter? = null
) : Record
