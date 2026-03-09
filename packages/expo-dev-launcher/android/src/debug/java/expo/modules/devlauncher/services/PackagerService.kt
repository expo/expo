package expo.modules.devlauncher.services

import android.app.Application
import expo.modules.devlauncher.nsd.NsdDiscovery
import okhttp3.OkHttpClient

data class PackagerInfo(
  val url: String,
  val description: String
)

class PackagerService(
  application: Application,
  httpClient: OkHttpClient
) {
  private var nsdDiscovery = NsdDiscovery(application, httpClient)
  val runningPackagers = nsdDiscovery.discoveredPackagers

  fun start() {
    nsdDiscovery.start()
  }

  fun resumeHealthCheck() {
    nsdDiscovery.resumeHealthCheck()
  }

  fun pauseHealthCheck() {
    nsdDiscovery.pauseHealthCheck()
  }

  fun stop() {
    nsdDiscovery.stop()
  }
}
