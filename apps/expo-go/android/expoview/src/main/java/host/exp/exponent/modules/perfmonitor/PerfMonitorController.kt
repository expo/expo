package host.exp.exponent.modules.perfmonitor

import android.content.Context
import com.facebook.react.bridge.ReactContext

internal class PerfMonitorController(
  context: Context,
  private val onDisableRequested: () -> Unit
) {
  private val dataSource = PerfMonitorDataSource()
  private val overlay = PerfMonitorOverlay(context, dataSource) {
    disable()
    onDisableRequested()
  }
  private var currentContext: ReactContext? = null
  private var enabled = false
  private var dataSourceRunning = false

  fun enable(reactContext: ReactContext?) {
    currentContext = reactContext
    enabled = true
    overlay.setReactContext(reactContext)

    if (!overlay.isShowing()) {
      try {
        overlay.show()
      } catch (_: Throwable) {
        enabled = false
        onDisableRequested.invoke()
        return
      }
    }
    maybeStartDataSource()
  }

  fun disable() {
    enabled = false
    if (dataSourceRunning) {
      dataSource.stop()
      dataSourceRunning = false
    }
    overlay.hide()
  }

  fun onContextCreated(reactContext: ReactContext) {
    currentContext = reactContext
    maybeStartDataSource()
  }

  fun onContextDestroyed(reactContext: ReactContext) {
    if (currentContext == reactContext) {
      currentContext = null
      if (dataSourceRunning) {
        dataSource.stop()
        dataSourceRunning = false
      }
    }
  }

  fun syncEnabledState(isEnabled: Boolean, context: ReactContext?) {
    if (isEnabled) {
      enable(context ?: currentContext)
    } else {
      disable()
    }
  }

  fun isEnabled() = enabled

  private fun maybeStartDataSource() {
    if (!enabled) {
      return
    }
    val reactContext = currentContext ?: return
    if (!dataSourceRunning) {
      dataSource.start(reactContext)
      dataSourceRunning = true
    }
  }
}
