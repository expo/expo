package expo.modules.devmenu.api

import android.net.Uri
import expo.modules.devmenu.helpers.await
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody

class DevMenuMetroClient {
  private val httpClient = OkHttpClient()

  suspend fun queryJSInspectorAvailability(metroHost: String, applicationId: String): Boolean {
    val url = Uri.parse("$metroHost/inspector")
      .buildUpon()
      .appendQueryParameter("applicationId", applicationId)
      .build()
    val request = Request.Builder()
      .get()
      .url(url.toString())
      .build()
    return try {
      request.await(httpClient).isSuccessful
    } catch (e: Exception) {
      false
    }
  }

  suspend fun openJSInspector(metroHost: String, applicationId: String) {
    val url = Uri.parse("$metroHost/inspector")
      .buildUpon()
      .appendQueryParameter("applicationId", applicationId)
      .build()
    val request = Request.Builder()
      .put(RequestBody.create(null, ""))
      .url(url.toString())
      .build()
    request.await(httpClient)
  }
}
