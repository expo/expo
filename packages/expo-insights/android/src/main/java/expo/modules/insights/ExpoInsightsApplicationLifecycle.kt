package expo.modules.insights

import android.app.Application
import android.os.SystemClock
import android.system.Os
import android.system.OsConstants
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import expo.modules.core.interfaces.ApplicationLifecycleListener
import java.io.RandomAccessFile

class ExpoInsightsApplicationLifecycle : ApplicationLifecycleListener {
  override fun onCreate(application: Application?) {
    Insights.send(event = "PROCESS_START", getProcessStartTime())

    super.onCreate(application)
    ReactMarker.addListener(markerListener)
  }

  private fun getProcessStartTime(): Long {
    val statReader = RandomAccessFile("/proc/self/stat", "r")
    val stat = statReader.readLine()
    statReader.close()

    val startTimeTicks = stat.split(" ")[21].toLong()
    val ticksPerSecond = Os.sysconf(OsConstants._SC_CLK_TCK)
    val processStartElapsedMs = (startTimeTicks * 1000) / ticksPerSecond
    val nowElapsedMs = SystemClock.elapsedRealtime()
    return System.currentTimeMillis() - (nowElapsedMs - processStartElapsedMs)
  }

  private val markerListener = ReactMarker.MarkerListener { name, _, _ ->
    val date = System.currentTimeMillis()
    when (name) {
      ReactMarkerConstants.APP_STARTUP_END,
      ReactMarkerConstants.CONTENT_APPEARED,
      ReactMarkerConstants.RUN_JS_BUNDLE_START,
      ReactMarkerConstants.RUN_JS_BUNDLE_END -> {
        Insights.sendOnce(event = name.toString(), at = date)
      }
      else -> {}
    }
  }
}
