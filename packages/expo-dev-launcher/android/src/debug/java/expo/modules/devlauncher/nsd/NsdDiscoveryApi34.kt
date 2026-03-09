package expo.modules.devlauncher.nsd

import android.app.Application
import android.net.nsd.NsdServiceInfo
import android.os.Build
import androidx.annotation.RequiresApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.isActive
import okhttp3.OkHttpClient

@RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
internal class NsdDiscoveryApi34(
  application: Application,
  httpClient: OkHttpClient
) : NsdDiscoveryBase(application, httpClient) {
  override suspend fun launchServiceLoop(serviceName: String, serviceInfo: NsdServiceInfo) {
    manager
      .serviceInfoFlow(serviceInfo)
      .collectLatest { resolved ->
        val url = resolved.getUrl()
        val name = resolved.getAttribute("name")

        if (url != null && name != null) {
          healthCheckLoop(serviceName, url, name)
        }
      }
  }

  private suspend fun healthCheckLoop(serviceName: String, url: String, name: String) {
    while (coroutineScope.isActive) {
      awaitHealthCheckActive()

      val isAlive = checkPackagerStatus(url)
      coroutineScope.ensureActive()

      if (isAlive) {
        addDiscoveredPackager(serviceName, url, name)
      } else {
        removeDiscoveredPackager(serviceName)
      }

      delay(HEALTH_CHECK_INTERVAL)
    }
  }
}
