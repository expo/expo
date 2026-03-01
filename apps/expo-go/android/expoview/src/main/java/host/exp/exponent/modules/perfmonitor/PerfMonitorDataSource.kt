package host.exp.exponent.modules.perfmonitor

import android.os.Handler
import android.os.Looper
import android.view.Choreographer
import androidx.annotation.AnyThread
import androidx.annotation.MainThread
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.fabric.DevToolsReactPerfLogger
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import kotlin.math.max
import kotlin.math.min

/**
 * Collects runtime metrics (UI/JS FPS, RSS, Hermes heap placeholder, Fabric layout duration)
 */
internal class PerfMonitorDataSource() : DevToolsReactPerfLogger.DevToolsReactPerfLoggerListener {
  data class Track(
    val label: String,
    val currentFps: Int,
    val history: List<Double>
  )

  data class Snapshot(
    val uiTrack: Track,
    val jsTrack: Track,
    val rssMB: Double,
    val layoutDurationMs: Double
  )

  interface Listener {
    @MainThread
    fun onSnapshot(snapshot: Snapshot)
  }

  private val listeners = mutableListOf<Listener>()
  private val uiBuffer = FpsBuffer("UI", FpsBuffer.TrackType.UI)
  private val jsBuffer = FpsBuffer("JS", FpsBuffer.TrackType.JS)
  private val handler = Handler(Looper.getMainLooper())

  private var fpsRunnable: Runnable? = null
  private var fabricListenerAttached = false
  private var layoutDurationMs = 0.0
  private var reactContext: ReactContext? = null
  val uiManager: FabricUIManager?
    get() {
      val reactContext = reactContext ?: return null
      return UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as? FabricUIManager
    }

  fun addListener(listener: Listener) {
    listeners.add(listener)
  }

  fun removeListener(listener: Listener) {
    listeners.remove(listener)
  }

  @AnyThread
  fun start(reactContext: ReactContext) {
    UiThreadUtil.runOnUiThread {
      if (fpsRunnable != null) {
        return@runOnUiThread
      }
      this.reactContext = reactContext
      uiBuffer.start(reactContext)
      jsBuffer.start(reactContext)
      attachFabricListenerIfNeeded(reactContext)
      scheduleNextTick()
    }
  }

  @AnyThread
  fun stop() {
    UiThreadUtil.runOnUiThread {
      handler.removeCallbacksAndMessages(null)
      fpsRunnable = null
      uiBuffer.stop()
      jsBuffer.stop()
      detachFabricListenerIfNeeded()
      reactContext = null
    }
  }

  override fun onFabricCommitEnd(commitPoint: DevToolsReactPerfLogger.FabricCommitPoint) {
    val duration = commitPoint.layoutDuration
    if (duration > 0) {
      layoutDurationMs = duration.toDouble()
    }
  }

  private fun scheduleNextTick() {
    handler.removeCallbacksAndMessages(null)
    val runnable = Runnable {
      val uiTrack = uiBuffer.collect()
      val jsTrack = jsBuffer.collect()
      val rss = readRss()

      val snapshot = Snapshot(
        uiTrack = uiTrack,
        jsTrack = jsTrack,
        rssMB = rss,
        layoutDurationMs = layoutDurationMs
      )
      listeners.forEach { it.onSnapshot(snapshot) }
      scheduleNextTick()
    }
    fpsRunnable = runnable
    handler.postDelayed(runnable, SAMPLE_INTERVAL_MS)
  }

  private fun readRss(): Double {
    val runtime = Runtime.getRuntime()
    val javaHeapUsed = (runtime.totalMemory() - runtime.freeMemory()) / 1024.0 / 1024.0
    val nativeHeap = android.os.Debug.getNativeHeapAllocatedSize() / 1024.0 / 1024.0
    return javaHeapUsed + nativeHeap
  }

  private fun attachFabricListenerIfNeeded(reactContext: ReactContext) {
    if (fabricListenerAttached) return
    val uiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
    if (uiManager is FabricUIManager) {
      var logger = uiManager.mDevToolsReactPerfLogger

      if (logger == null) {
        logger = DevToolsReactPerfLogger()
        uiManager.mDevToolsReactPerfLogger = logger
        ReactMarker.addFabricListener(logger)
      }

      logger.addDevToolsReactPerfLoggerListener(this)
      fabricListenerAttached = true
    }
  }

  private fun detachFabricListenerIfNeeded() {
    if (!fabricListenerAttached) return
    val reactContext = reactContext ?: return
    val uiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
    if (uiManager is FabricUIManager) {
      uiManager.mDevToolsReactPerfLogger?.removeDevToolsReactPerfLoggerListener(this)
    }
    fabricListenerAttached = false
  }

  private class FpsBuffer(
    private val label: String,
    private val trackType: TrackType
  ) {
    enum class TrackType { UI, JS }

    private var choreographerCallback: ChoreographerFpsTracker? = null
    private val history = ArrayDeque<Double>()

    fun start(reactContext: ReactContext) {
      stop()
      choreographerCallback = ChoreographerFpsTracker(trackType, reactContext).also {
        it.start()
      }
      history.clear()
    }

    fun collect(): Track {
      val tracker = choreographerCallback ?: return Track(label, 0, emptyList())
      val fps = tracker.getFpsAndReset()
      if (history.size >= HISTORY_LENGTH) {
        history.removeFirst()
      }
      history.addLast(fps)
      val clamped = history.map { sample -> min(max(sample, 0.0), MAX_FPS) }
      return Track(label, fps.toInt(), clamped)
    }

    fun stop() {
      choreographerCallback?.stop()
      choreographerCallback = null
      history.clear()
    }

    companion object {
      private const val HISTORY_LENGTH = 10
      private const val MAX_FPS = 120.0
    }
  }

  /**
   * This replaces FpsDebugFrameCallback.
   * For UI tracking: runs on main thread's Choreographer
   * For JS tracking: runs on JS thread's Choreographer (if available, otherwise falls back to main)
   */
  private class ChoreographerFpsTracker(
    private val trackType: FpsBuffer.TrackType,
    private val reactContext: ReactContext
  ) {
    private var frameCount = 0
    private var startTimeNanos = 0L
    private var isRunning = false

    @Volatile
    private var choreographer: Choreographer? = null

    private val frameCallback = object : Choreographer.FrameCallback {
      override fun doFrame(frameTimeNanos: Long) {
        if (!isRunning) {
          return
        }
        frameCount++
        choreographer?.postFrameCallback(this)
      }
    }

    fun start() {
      if (isRunning) {
        return
      }
      isRunning = true
      frameCount = 0
      startTimeNanos = System.nanoTime()

      when (trackType) {
        FpsBuffer.TrackType.UI -> {
          UiThreadUtil.runOnUiThread {
            choreographer = Choreographer.getInstance()
            choreographer?.postFrameCallback(frameCallback)
          }
        }

        FpsBuffer.TrackType.JS -> {
          try {
            reactContext.runOnJSQueueThread {
              try {
                choreographer = Choreographer.getInstance()
                choreographer?.postFrameCallback(frameCallback)
              } catch (_: Throwable) {
                isRunning = false
              }
            }
          } catch (_: Throwable) {
            isRunning = false
          }
        }
      }
    }

    fun stop() {
      if (!isRunning) {
        return
      }
      isRunning = false
      choreographer?.removeFrameCallback(frameCallback)
      choreographer = null
    }

    fun getFpsAndReset(): Double {
      if (!isRunning) {
        return 0.0
      }

      val currentTimeNanos = System.nanoTime()
      val elapsedSeconds = (currentTimeNanos - startTimeNanos) / 1_000_000_000.0
      val fps = if (elapsedSeconds > 0) {
        frameCount / elapsedSeconds
      } else {
        0.0
      }

      frameCount = 0
      startTimeNanos = currentTimeNanos

      return fps
    }
  }

  companion object {
    private const val SAMPLE_INTERVAL_MS = 1_000L
  }
}
