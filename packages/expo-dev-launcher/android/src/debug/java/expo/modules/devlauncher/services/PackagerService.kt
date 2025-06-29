package expo.modules.devlauncher.services

import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.helpers.await
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import kotlin.time.Duration.Companion.seconds

private val portsToCheck = arrayOf(8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002)
private val hostToCheck = if (EmulatorUtilities.isRunningOnEmulator()) {
  "10.0.2.2"
} else {
  "localhost"
}

data class PackagerInfo(
  val host: String,
  val port: Int
) {
  internal fun createStatusPageRequest(): Request {
    val url = "http://$host:$port/status"
    return Request.Builder()
      .url(url)
      .build()
  }

  val url: String
    get() = "http://$host:$port"
}

private val defaultDelay = 3.seconds

/*
 * Class responsible for discovering running packagers.
 */
class PackagerService(
  private val httpClient: OkHttpClient,
  scope: CoroutineScope
) {
  private val packagersToCheck = portsToCheck.map { PackagerInfo(hostToCheck, it) }

  private val _runningPackagers = MutableStateFlow<Set<PackagerInfo>>(emptySet())

  val runningPackagers = _runningPackagers.asStateFlow()

  init {
    scope.launch(Dispatchers.IO) {
      while (isActive) {
        for (packager in packagersToCheck) {
          val statusPageRequest = packager.createStatusPageRequest()
          launch {
            val data = runCatching { statusPageRequest.await(httpClient) }.getOrNull()
            val isSuccessful = data?.isSuccessful == true
            if (isSuccessful) {
              _runningPackagers.update {
                if (!it.contains(packager)) {
                  it.plus(packager)
                } else {
                  it
                }
              }
            } else {
              _runningPackagers.update {
                if (it.contains(packager)) {
                  it.minus(packager)
                } else {
                  it
                }
              }
            }
          }
        }
        delay(defaultDelay)
      }
    }
  }
}
