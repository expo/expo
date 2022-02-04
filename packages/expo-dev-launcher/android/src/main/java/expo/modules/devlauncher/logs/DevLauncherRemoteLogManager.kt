package expo.modules.devlauncher.logs

import android.net.Uri
import android.os.Build
import expo.modules.devlauncher.helpers.await
import expo.modules.devlauncher.helpers.post
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.RequestBody

class DevLauncherRemoteLogManager(private val httpClient: OkHttpClient, private val url: Uri) {
  private val batch: MutableList<DevLauncherRemoteLog> = mutableListOf()

  fun deferError(throwable: Throwable) {
    addToBatch(
      DevLauncherRemoteLog(
        DevLauncherExceptionRemoteLogBody(throwable)
      )
    )
  }

  fun deferError(message: String) {
    addToBatch(
      DevLauncherRemoteLog(
        DevLauncherSimpleRemoteLogBody(message)
      )
    )
  }

  private fun addToBatch(log: DevLauncherRemoteLog) {
    batch.add(log)
  }

  fun sendSync() = runBlocking {
    val content = batch.joinToString(separator = ",") { it.toJson() }
    val requestBody = RequestBody.create(MediaType.get("application/json"), "[$content]")

    val postRequest = post(
      url,
      requestBody,
      "Device-Id" to Build.ID,
      "Device-Name" to Build.DISPLAY
    )
    postRequest.await(httpClient)

    batch.clear()
  }
}
