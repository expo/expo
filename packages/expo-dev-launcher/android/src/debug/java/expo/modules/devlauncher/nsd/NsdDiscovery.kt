package expo.modules.devlauncher.nsd

import android.app.Application
import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import expo.modules.devlauncher.services.PackagerInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

private const val SERVICE_TYPE = "_expo._tcp."

class NsdDiscovery(
  application: Application
) {
  private val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

  private val _manger: NsdManager? =
    application.getSystemService(Context.NSD_SERVICE) as? NsdManager

  private val manager: NsdManager
    get() = requireNotNull(_manger) { "NsdManager not available on this device" }

  private val _discoveredPackagers = MutableStateFlow<Set<PackagerInfo>>(emptySet())
  val discoveredPackagers = _discoveredPackagers.asStateFlow()

  private var isDiscovering = false

  private var discoveryListener = NsdDiscoveryListener(
    onServiceFound = {
      coroutineScope.launch { resolveAndAddService(it) }
    },
    onServiceLost = {
      removeService(it)
    },
    onStartFailed = {
      isDiscovering = false
    }
  )

  fun start() {
    if (isDiscovering) {
      return
    }

    manager.discoverServices(
      SERVICE_TYPE,
      NsdManager.PROTOCOL_DNS_SD,
      discoveryListener
    )
    isDiscovering = true
  }

  fun stop() {
    if (!isDiscovering) {
      return
    }

    runCatching {
      manager.stopServiceDiscovery(discoveryListener)
    }.onFailure {
      Log.e("DevLauncher", "Failed to stop NSD discovery", it)
    }

    isDiscovering = false
    _discoveredPackagers.value = emptySet()
  }

  private suspend fun resolveAndAddService(serviceInfo: NsdServiceInfo) {
    val resolved = manager.resolveServiceCoroutine(serviceInfo)
    coroutineScope.ensureActive()

    val url = resolved.getUrl() ?: return

    val description = resolved.getAttribute("name") ?: "Unknown Packager"

    val packager = PackagerInfo(
      url = url,
      description = description
    )
    _discoveredPackagers.value = _discoveredPackagers.value.plus(packager)
  }

  private fun removeService(serviceInfo: NsdServiceInfo) {
    val url = serviceInfo.getUrl() ?: run {
      Log.e("DevLauncher", "Failed to get URL from service info during removal: $serviceInfo")
      return
    }

    _discoveredPackagers.value = _discoveredPackagers.value.filter { packager ->
      packager.url == url
    }.toSet()
  }
}
