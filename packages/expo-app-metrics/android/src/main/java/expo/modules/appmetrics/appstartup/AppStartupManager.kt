package expo.modules.appmetrics.appstartup

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import expo.modules.appmetrics.AppStartupMetric
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.frames.FrameMetricsRecorder
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.utils.TimeUtils.getCurrentTimeInMillis
import expo.modules.appmetrics.utils.TimeUtils.getCurrentTimestampInISOFormat
import expo.modules.appmetrics.utils.TimeUtils.getProcessStartTimeInMillis
import org.json.JSONObject

enum class AppStartType { COLD, WARM }

enum class StartupState { LAUNCHING, LAUNCHED, INTERRUPTED }

data class EASObserveAppStartupInfo(
  val startType: AppStartType,
  // The timestamp of the Application.onCreate
  // Use for the edge case when background process started long before activity creation
  // In most cases should be handled by the startType detection
  val appCreateTimestamp: Long,
  // Timestamp used to calculate the launch time for warm activity only start
  val activityCreateTimestamp: Long? = null
)

object AppStartupManager {
  private const val BACKGROUND_THRESHOLD_MS = 60_000L

  private val _metrics: MutableList<Metric> = mutableListOf()
  internal val metrics: List<Metric>
    get() = _metrics

  private var bundleLoadStartTime: Long? = null
  private var launchTimeInMillis: Long? = null
  private var hasRecordedInteractive = false
  private var hasRecordedFirstRender = false

  @Volatile
  var startupState: StartupState = StartupState.LAUNCHING
    set(value) {
      field = value
      if (value == StartupState.INTERRUPTED) {
        frameMetricsRecorder.stop()
      }
    }
  private var startupInfo: EASObserveAppStartupInfo? = null

  private val frameMetricsRecorder = FrameMetricsRecorder()

  init {
    Log.d(TAG, "Creating manager")
    ReactMarker.addListener { name, _, _ ->
      when (name) {
        ReactMarkerConstants.RUN_JS_BUNDLE_START -> {
          bundleLoadStartTime = getCurrentTimeInMillis()
        }

        ReactMarkerConstants.RUN_JS_BUNDLE_END -> {
          if (startupState != StartupState.LAUNCHING) return@addListener
          val loadStartTime = bundleLoadStartTime
          if (loadStartTime == null) {
            Log.w(
              TAG,
              "Received RUN_JS_BUNDLE_END, when bundleLoadStartTime is null "
            )
          } else {
            addMetric(
              AppStartupMetric.BundleLoadTime,
              valueInMs = getCurrentTimeInMillis() - loadStartTime
            )
          }
        }

        else -> {}
      }
    }
  }

  private fun addMetricAtCurrentTimestamp(
    metric: AppStartupMetric,
    routeName: String? = null
  ) {
    addMetric(
      metric = metric,
      valueInMs = (getCurrentTimeInMillis() - getProcessStartTimeInMillis()),
      routeName = routeName
    )
  }

  private fun addMetric(
    metric: AppStartupMetric,
    valueInMs: Long,
    routeName: String? = null,
    params: Map<String, Any>? = null
  ) {
    _metrics.add(
      Metric(
        sessionId = "",
        name = metric.metricName,
        category = AppStartupMetric.category.categoryName,
        value = valueInMs.toDouble() / 1000.0,
        timestamp = getCurrentTimestampInISOFormat(),
        routeName = routeName,
        params = params?.let { JSONObject(it).toString() }
      )
    )
  }

  private fun addMetricSinceLaunch(
    metric: AppStartupMetric,
    routeName: String? = null,
    params: Map<String, Any>? = null
  ) {
    val launch = launchTimeInMillis ?: return
    addMetric(
      metric = metric,
      valueInMs = getCurrentTimeInMillis() - launch,
      routeName = routeName,
      params = params
    )
  }

  fun recordAppCreated(context: Context) {
    val timestamp = getCurrentTimeInMillis()
    val startType = detectStartType(context)
    startupInfo = EASObserveAppStartupInfo(startType = startType, appCreateTimestamp = timestamp)
  }

  private fun detectStartType(context: Context): AppStartType {
    // Check importance on all API levels — background processes are never cold starts
    val processInfo = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(processInfo)
    if (processInfo.importance != ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
      return AppStartType.WARM
    }

    // The ApplicationStartInfo API is only available on Android SDK 35+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      val am = context.getSystemService(ActivityManager::class.java) ?: return AppStartType.WARM
      val startInfos = am.getHistoricalProcessStartReasons(1)
      val info = startInfos.firstOrNull() ?: return AppStartType.WARM
      // Only user-initiated starts (launcher or recents) can be cold
      if (info.reason != android.app.ApplicationStartInfo.START_REASON_LAUNCHER &&
        info.reason != android.app.ApplicationStartInfo.START_REASON_LAUNCHER_RECENTS
      ) {
        return AppStartType.WARM
      }
      return if (info.startType == android.app.ApplicationStartInfo.START_TYPE_COLD) {
        AppStartType.COLD
      } else {
        AppStartType.WARM
      }
    }

    // Pre-35: can't reliably distinguish cold starts without the system API
    return AppStartType.WARM
  }

  // This captures the activity creation timestamp as early as possible.
  fun markActivityCreate() {
    val info = startupInfo ?: return
    if (info.activityCreateTimestamp != null) return
    startupInfo = info.copy(activityCreateTimestamp = getCurrentTimeInMillis())
  }

  fun markLoadedIfNeeded(activity: Activity) {
    if (launchTimeInMillis != null) return
    val launchTime = getCurrentTimeInMillis()
    launchTimeInMillis = launchTime

    // Start tracking frame metrics from this point so the data
    // matches the TTI window (markLoaded → markInteractive).
    frameMetricsRecorder.start(activity)

    var info = startupInfo ?: return
    val timeSinceProcessStart = launchTime - getProcessStartTimeInMillis()
    // This will only happen when process was started well before activity creation,
    // and should have been handled by the detectStartType.
    // But we add this safeguard just in case, to avoid misclassifying cold starts as warm.
    if (timeSinceProcessStart > BACKGROUND_THRESHOLD_MS && info.startType == AppStartType.COLD) {
      info = info.copy(startType = AppStartType.WARM)
      startupInfo = info
    }

    if (startupState == StartupState.LAUNCHING && info.activityCreateTimestamp != null) {
      when (info.startType) {
        AppStartType.COLD -> addMetricAtCurrentTimestamp(AppStartupMetric.ColdLaunchTime)

        AppStartType.WARM -> addMetric(
          AppStartupMetric.WarmLaunchTime,
          valueInMs = launchTime - info.activityCreateTimestamp
        )
      }
    } else {
      Log.w(TAG, "markLoadedIfNeeded: activityCreateTimestamp is null, skipping metric")
    }
  }

  fun markInteractive(routeName: String? = null, params: Map<String, Any>? = null) {
    if (startupState != StartupState.LAUNCHING || hasRecordedInteractive) return
    hasRecordedInteractive = true

    val frameMetrics = frameMetricsRecorder.stop()
    val mergedParams = if (frameMetrics.expectedFrames > 0) {
      params.orEmpty() + mapOf(
        "frameRate.slowFrames" to frameMetrics.slowFrames,
        "frameRate.frozenFrames" to frameMetrics.frozenFrames,
        "frameRate.totalDelay" to frameMetrics.freezeTimeMs.toDouble() / 1000.0
      )
    } else {
      params
    }

    addMetricSinceLaunch(AppStartupMetric.TimeToInteractive, routeName, mergedParams)
    startupState = StartupState.LAUNCHED
  }

  fun markFirstRender() {
    if (startupState != StartupState.LAUNCHING || hasRecordedFirstRender) return
    hasRecordedFirstRender = true
    addMetricSinceLaunch(AppStartupMetric.TimeToFirstRender)
  }
}
