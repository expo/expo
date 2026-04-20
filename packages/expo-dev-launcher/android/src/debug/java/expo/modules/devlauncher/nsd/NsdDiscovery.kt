package expo.modules.devlauncher.nsd

import android.app.Application
import android.os.Build
import expo.modules.devlauncher.services.PackagerInfo
import kotlinx.coroutines.flow.StateFlow
import okhttp3.OkHttpClient

interface NsdDiscovery {
  val discoveredPackagers: StateFlow<Set<PackagerInfo>>

  fun start()
  fun restart()
  fun resumeHealthCheck()
  fun pauseHealthCheck()
  fun stop()
}

fun NsdDiscovery(application: Application, httpClient: OkHttpClient): NsdDiscovery {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
    NsdDiscoveryApi34(application, httpClient)
  } else {
    NsdDiscoveryLegacy(application, httpClient)
  }
}
