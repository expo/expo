package expo.modules.devlauncher.services

import android.app.Application
import expo.modules.devlauncher.nsd.NsdDiscovery
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PackagerInfo(
  val url: String,
  val description: String
)

class PackagerService(
  application: Application
) {
  private var nsdDiscovery = NsdDiscovery(application)

  private val _isLoading = MutableStateFlow(false)

  val runningPackagers = nsdDiscovery.discoveredPackagers
  val isLoading = _isLoading.asStateFlow()

  fun start() {
    nsdDiscovery.start()
  }

  fun stop() {
    nsdDiscovery.stop()
  }
}
