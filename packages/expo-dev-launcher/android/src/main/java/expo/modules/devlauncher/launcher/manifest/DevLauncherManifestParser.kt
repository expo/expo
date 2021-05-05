package expo.modules.devlauncher.launcher.manifest

import android.net.Uri
import expo.modules.devlauncher.helpers.await
import expo.modules.devlauncher.helpers.fetch
import okhttp3.OkHttpClient
import java.io.Reader

class DevLauncherManifestParser(
  private val httpClient: OkHttpClient,
  private val url: Uri
) {
  suspend fun isManifestUrl(): Boolean {
    val response = fetch(url, "HEAD").await(httpClient)
    require(response.isSuccessful) { "Make sure that the metro bundler is running." }
    return response.header("Exponent-Server", null) != null
  }

  private suspend fun downloadManifest(): Reader {
    val response = fetch(url, "GET").await(httpClient)
    require(response.isSuccessful)
    return response.body()!!.charStream()
  }

  suspend fun parseManifest(): DevLauncherManifest {
    downloadManifest().use {
      return DevLauncherManifest.fromJson(it)
    }
  }
}
