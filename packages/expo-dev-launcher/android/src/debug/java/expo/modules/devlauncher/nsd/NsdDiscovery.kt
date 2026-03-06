package expo.modules.devlauncher.nsd

import android.app.Application
import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import expo.modules.devlauncher.helpers.await
import expo.modules.devlauncher.services.PackagerInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import kotlin.time.DurationUnit
import kotlin.time.toDuration
import kotlin.time.toJavaDuration

private const val SERVICE_TYPE = "_expo._tcp."
private val HEALTH_CHECK_INTERVAL = 3.toDuration(DurationUnit.SECONDS)
private val HEALTH_CHECK_TIMEOUT = 5.toDuration(DurationUnit.SECONDS).toJavaDuration()

data class PotentialPackager(
  val serviceName: String,
  val url: String,
  val name: String
)

class NsdDiscovery(
  application: Application,
  httpClient: OkHttpClient
) {
  private val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

  private val healthCheckClient = httpClient.newBuilder()
    .connectTimeout(HEALTH_CHECK_TIMEOUT)
    .readTimeout(HEALTH_CHECK_TIMEOUT)
    .writeTimeout(HEALTH_CHECK_TIMEOUT)
    .build()

  private val _manger: NsdManager? =
    application.getSystemService(Context.NSD_SERVICE) as? NsdManager

  private val manager: NsdManager
    get() = requireNotNull(_manger) { "NsdManager not available on this device" }

  private val _potentialPackagers = MutableStateFlow<Set<PotentialPackager>>(emptySet())

  private val _discoveredPackagers = MutableStateFlow<Set<PackagerInfo>>(emptySet())
  val discoveredPackagers = _discoveredPackagers.asStateFlow()

  private var isDiscovering = false
  private var healthCheckJob: Job? = null

  private var discoveryListener = NsdDiscoveryListener(
    onStopped = {
      _potentialPackagers.value = emptySet()
      _discoveredPackagers.value = emptySet()
    },
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

  fun start() = synchronized(this) {
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

  fun resumeHealthCheck() = synchronized(this) {
    if (isDiscovering) {
      startHealthCheckLoop()
    }
  }

  fun pauseHealthCheck() = synchronized(this) {
    if (isDiscovering) {
      stopHealthCheckLoop()
    }
  }

  fun stop() = synchronized(this) {
    if (!isDiscovering) {
      return
    }

    runCatching {
      manager.stopServiceDiscovery(discoveryListener)
    }.onFailure {
      Log.e("DevLauncher", "Failed to stop NSD discovery", it)
    }
    isDiscovering = false
  }

  private suspend fun resolveAndAddService(serviceInfo: NsdServiceInfo) {
    val resolved = manager.resolveServiceCoroutine(serviceInfo)
    coroutineScope.ensureActive()

    val serviceName = resolved.serviceName ?: return
    val url = resolved.getUrl() ?: return
    val name = resolved.getAttribute("name") ?: return

    val packager = PotentialPackager(
      url = url,
      serviceName = serviceName,
      name = name
    )
    _potentialPackagers.value = _potentialPackagers.value.plus(packager)
  }

  private fun removeService(serviceInfo: NsdServiceInfo) {
    val serviceName = serviceInfo.serviceName ?: return
    _potentialPackagers.update {
      it.filter { packager ->
        packager.serviceName != serviceName
      }.toSet()
    }
  }

  private fun startHealthCheckLoop() {
    stopHealthCheckLoop()
    healthCheckJob = coroutineScope.launch {
      while (isActive) {
        val currentPackagers = _potentialPackagers.value
        val alivePackagers = currentPackagers
          .map { packager ->
            async {
              packager to checkPackagerStatus(packager.url)
            }
          }
          .awaitAll()
          .filter { (_, isAlive) -> isAlive }
          .map { (packager, _) -> PackagerInfo(url = packager.url, description = packager.name) }
          .toSet()

        ensureActive()
        _discoveredPackagers.value = alivePackagers

        delay(HEALTH_CHECK_INTERVAL)
      }
    }
  }

  private fun stopHealthCheckLoop() {
    healthCheckJob?.cancel()
    healthCheckJob = null
  }

  private suspend fun checkPackagerStatus(url: String): Boolean {
    runCatching {
      val request = Request.Builder()
        .url("$url/status")
        .build()
      val response = request.await(healthCheckClient)
      if (!response.isSuccessful) {
        return false
      }

      val body = response.body?.string() ?: return false
      return body.contains("packager-status:running")
    }

    return false
  }
}
