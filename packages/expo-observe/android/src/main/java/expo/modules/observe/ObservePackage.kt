package expo.modules.observe

import android.app.Application
import android.content.Context
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.observe.storage.DatabaseMetricsSink

class ObservePackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener?> =
    listOf(
      object : ApplicationLifecycleListener {
        // Runs before any module is created, so the sink receives records from the start.
        override fun onCreate(application: Application) {
          MetricsSinkRegistry.register(DatabaseMetricsSink.getInstance(application))
        }
      }
    )
}
