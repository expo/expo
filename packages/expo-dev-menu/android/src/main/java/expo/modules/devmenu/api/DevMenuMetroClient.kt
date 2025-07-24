package expo.modules.devmenu.api

import androidx.core.net.toUri
import expo.modules.devmenu.helpers.await
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class DevMenuMetroClient {
  private val httpClient = OkHttpClient()

  suspend fun openJSInspector(metroHost: String, applicationId: String) {
    val url = "$metroHost/_expo/debugger".toUri()
      .buildUpon()
      .appendQueryParameter("applicationId", applicationId)
      .build()
    val request = Request.Builder()
      .put("".toRequestBody(null))
      .url(url.toString())
      .build()
    request.await(httpClient)
  }
}
