package expo.modules.devlauncher.nsd

import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo

class NsdDiscoveryListener(
  private val onServiceFound: (NsdServiceInfo) -> Unit,
  private val onServiceLost: (NsdServiceInfo) -> Unit,
  private val onStartFailed: () -> Unit
) : NsdManager.DiscoveryListener {
  override fun onDiscoveryStarted(serviceType: String) = Unit

  override fun onDiscoveryStopped(serviceType: String) = Unit

  override fun onServiceFound(serviceInfo: NsdServiceInfo) {
    onServiceFound.invoke(serviceInfo)
  }

  override fun onServiceLost(serviceInfo: NsdServiceInfo) {
    onServiceLost.invoke(serviceInfo)
  }

  override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
    onStartFailed.invoke()
  }

  override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) = Unit
}
