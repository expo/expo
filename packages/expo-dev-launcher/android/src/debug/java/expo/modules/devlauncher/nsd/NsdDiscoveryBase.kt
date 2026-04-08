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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.ConcurrentHashMap
import kotlin.time.DurationUnit
import kotlin.time.toDuration
import kotlin.time.toJavaDuration

private const val SERVICE_TYPE = "_expo._tcp."

internal val HEALTH_CHECK_INTERVAL = 3.toDuration(DurationUnit.SECONDS)
private val HEALTH_CHECK_TIMEOUT = 5.toDuration(DurationUnit.SECONDS).toJavaDuration()

internal abstract class NsdDiscoveryBase(
  application: Application,
  httpClient: OkHttpClient
) : NsdDiscovery {
  protected val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

  protected val healthCheckClient: OkHttpClient = httpClient
    .newBuilder()
    .connectTimeout(HEALTH_CHECK_TIMEOUT)
    .readTimeout(HEALTH_CHECK_TIMEOUT)
    .writeTimeout(HEALTH_CHECK_TIMEOUT)
    .build()

  private val _manager: NsdManager? =
    application.getSystemService(Context.NSD_SERVICE) as? NsdManager

  protected val manager: NsdManager
    get() = requireNotNull(_manager) { "NsdManager not available on this device" }

  private val _discoveredPackagers = MutableStateFlow<Set<PackagerInfo>>(emptySet())
  override val discoveredPackagers = _discoveredPackagers.asStateFlow()

  private val alivePackagers = ConcurrentHashMap<String, PackagerInfo>()

  protected val healthCheckActive = MutableStateFlow(false)

  private var isDiscovering = false

  private val serviceJobs = mutableMapOf<String, Job>()

  private var discoveryListener: NsdDiscoveryListener? = null

  private fun createDiscoveryListener() = NsdDiscoveryListener(
    onStopped = {
      cancelServiceJobs()
    },
    onServiceFound = {
      onServiceFound(it)
    },
    onServiceLost = {
      onServiceLost(it)
    },
    onStartFailed = {
      synchronized(this) {
        isDiscovering = false
      }
    }
  )

  override fun start() = synchronized(this) {
    if (isDiscovering) {
      return
    }

    val listener = createDiscoveryListener()
    discoveryListener = listener
    manager.discoverServices(
      SERVICE_TYPE,
      NsdManager.PROTOCOL_DNS_SD,
      listener
    )
    isDiscovering = true
  }

  override fun resumeHealthCheck() = synchronized(this) {
    healthCheckActive.value = true
  }

  override fun pauseHealthCheck() = synchronized(this) {
    healthCheckActive.value = false
  }

  override fun restart() = synchronized(this) {
    val wasHealthCheckActive = healthCheckActive.value

    // Stop the old discovery cycle without clearing the packager list.
    // This keeps stale entries visible in the UI while new discovery runs,
    // avoiding a layout jump where servers briefly disappear.
    stopDiscoveryOnly()

    start()
    if (wasHealthCheckActive) {
      resumeHealthCheck()
    }
  }

  override fun stop() = synchronized(this) {
    stopDiscoveryOnly()
    cancelAndClearServiceJobs()
  }

  /**
   * Stops the NSD discovery listener and cancels service jobs, but keeps
   * [alivePackagers] intact so the UI doesn't flash an empty state.
   */
  private fun stopDiscoveryOnly() {
    if (!isDiscovering) {
      return
    }

    val listener = discoveryListener
    discoveryListener = null
    if (listener != null) {
      runCatching {
        manager.stopServiceDiscovery(listener)
      }.onFailure {
        Log.e("DevLauncher", "Failed to stop NSD discovery", it)
      }
    }
    cancelServiceJobs()
    healthCheckActive.value = false
    isDiscovering = false
  }

  private fun onServiceFound(serviceInfo: NsdServiceInfo) {
    val serviceName = serviceInfo.serviceName ?: return

    cancelServiceJob(serviceName)

    val job = coroutineScope.launch {
      launchServiceLoop(serviceName, serviceInfo)
      // Loop ended (canceled or error) - clean up
      removeDiscoveredPackager(serviceName)
    }

    synchronized(serviceJobs) {
      serviceJobs[serviceName] = job
    }
  }

  private fun onServiceLost(serviceInfo: NsdServiceInfo) {
    val serviceName = serviceInfo.serviceName ?: return
    cancelServiceJob(serviceName)
    removeDiscoveredPackager(serviceName)
  }

  protected abstract suspend fun launchServiceLoop(
    serviceName: String,
    serviceInfo: NsdServiceInfo
  )

  protected fun addDiscoveredPackager(
    serviceName: String,
    url: String,
    name: String,
    slug: String?,
    androidPackage: String?,
    username: String?
  ) {
    alivePackagers[serviceName] = PackagerInfo(
      url = url,
      description = name,
      slug = slug,
      androidPackage = androidPackage,
      username = username
    )
    publishDiscoveredPackagers()
  }

  protected fun removeDiscoveredPackager(serviceName: String) {
    if (alivePackagers.remove(serviceName) != null) {
      publishDiscoveredPackagers()
    }
  }

  private fun publishDiscoveredPackagers() {
    _discoveredPackagers.value = alivePackagers.values.toSet()
  }

  private fun cancelServiceJob(serviceName: String) {
    synchronized(serviceJobs) {
      serviceJobs.remove(serviceName)?.cancel()
    }
  }

  /**
   * Cancels all running service coroutines without clearing [alivePackagers].
   */
  private fun cancelServiceJobs() {
    synchronized(serviceJobs) {
      serviceJobs.values.forEach { it.cancel() }
      serviceJobs.clear()
    }
  }

  /**
   * Cancels all running service coroutines and clears the packager list.
   */
  private fun cancelAndClearServiceJobs() {
    cancelServiceJobs()
    alivePackagers.clear()
    publishDiscoveredPackagers()
  }

  protected suspend fun awaitHealthCheckActive() {
    healthCheckActive.first { it }
  }

  protected suspend fun checkPackagerStatus(url: String): Boolean {
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
