package host.exp.exponent.nsd

import android.app.Application
import android.net.nsd.NsdServiceInfo
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.isActive
import okhttp3.OkHttpClient

internal class NsdDiscoveryLegacy(
  application: Application,
  httpClient: OkHttpClient
) : NsdDiscoveryBase(application, httpClient) {
  @Suppress("DEPRECATION")
  override suspend fun launchServiceLoop(serviceName: String, serviceInfo: NsdServiceInfo) {
    while (coroutineScope.isActive) {
      awaitHealthCheckActive()

      val resolved = runCatching { manager.resolveServiceCoroutine(serviceInfo) }.getOrNull()
      coroutineScope.ensureActive()

      if (resolved != null) {
        val url = resolved.getUrl()
        val name = resolved.getAttribute("name")
        val slug = resolved.getAttribute("slug")
        val androidPackage = resolved.getAttribute("androidPackage")

        if (url != null && name != null) {
          val isAlive = checkPackagerStatus(url)
          coroutineScope.ensureActive()

          if (isAlive) {
            addDiscoveredPackager(
              serviceName,
              url,
              name,
              slug,
              androidPackage
            )
          } else {
            removeDiscoveredPackager(serviceName)
          }
        }
      } else {
        removeDiscoveredPackager(serviceName)
      }

      delay(HEALTH_CHECK_INTERVAL)
    }
  }
}
