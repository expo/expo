package expo.modules.devlauncher.services

import androidx.core.net.toUri
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.helpers.await
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted.Companion.WhileSubscribed
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import okhttp3.Request

private val portsToCheck = arrayOf(8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002)
private val hostToCheck = if (EmulatorUtilities.isRunningOnEmulator()) {
  "10.0.2.2"
} else {
  "localhost"
}

data class PackagerInfo(
  val url: String,
  val description: String? = null,
  val isDevelopmentSession: Boolean = false
) {
  internal val port = url.toUri().port

  internal fun createStatusPageRequest(): Request {
    val url = "$url/status"
    return Request.Builder()
      .url(url)
      .build()
  }
}

/*
 * Class responsible for discovering running packagers.
 */
class PackagerService(
  private val httpClientService: HttpClientService
) {
  private val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

  private val packagersToCheck = portsToCheck.map { port -> PackagerInfo("http://$hostToCheck:$port") }

  private val _runningPackagers = MutableStateFlow<Set<PackagerInfo>>(emptySet())
  private val _isLoading = MutableStateFlow(false)

  val runningPackagers = _runningPackagers
    .onStart {
      refetchedPackager()
    }.stateIn(
      scope = coroutineScope,
      started = WhileSubscribed(5_000),
      initialValue = emptySet()
    )
  val isLoading = _isLoading.asStateFlow()

  private fun addPackager(packager: PackagerInfo) {
    _runningPackagers.update { packagers ->
      // The packager list contains a development session packager, which the same port and we are trying to add local packager.
      // In this case, we can ignore the local packager, because the development session is more important.
      val canBeIgnored = packagers.any { it.port == packager.port && it.isDevelopmentSession && !packager.isDevelopmentSession }
      if (canBeIgnored) {
        return@update packagers
      }

      if (!packagers.contains(packager)) {
        packagers.plus(packager)
      } else {
        packagers
      }
    }
  }

  private fun removePackager(packager: PackagerInfo) {
    _runningPackagers.update { packagers ->
      if (packagers.contains(packager)) {
        packagers.minus(packager)
      } else {
        packagers
      }
    }
  }

  private suspend fun fetchedLocalPackagers(): Unit = coroutineScope {
    val jobs = packagersToCheck.map { packager ->
      ensureActive()
      async {
        val statusPageRequest = packager.createStatusPageRequest()
        val isSuccessful = runCatching { statusPageRequest.await(httpClientService.httpClient) }
          .getOrNull()
          ?.use { response -> response.isSuccessful }
          ?: false

        if (isSuccessful) {
          addPackager(packager)
        } else {
          removePackager(packager)
        }
      }
    }

    jobs.awaitAll()
  }

  private suspend fun fetchedDevelopmentSession() {
    val developmentSession = httpClientService.fetchDevelopmentSession()
    val newPackagers = developmentSession.map { session ->
      PackagerInfo(
        url = session.url,
        description = session.description,
        isDevelopmentSession = true
      )
    }

    _runningPackagers.update { packagers ->
      // We remove all existing development session packagers and
      // also local packagers with the same port as the new development session packagers
      val filteredPackager = packagers.filter {
        !it.isDevelopmentSession && newPackagers.all { newPackager -> newPackager.port != it.port }
      }

      filteredPackager.plus(
        developmentSession.map { session ->
          PackagerInfo(
            url = session.url,
            description = session.description,
            isDevelopmentSession = true
          )
        }
      ).toSet()
    }
  }

  fun refetchedPackager() {
    // It's loading already, so we don't need to do anything.
    if (isLoading.value) {
      return
    }

    _isLoading.update { true }
    coroutineScope.launch {
      fetchedDevelopmentSession()
      ensureActive()
      fetchedLocalPackagers()
      _isLoading.update { false }
    }
  }
}
