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
    // published projects should respond unsuccessfully to HEAD requests sent with no headers
    return !response.isSuccessful || response.header("Exponent-Server", null) != null
  }

  private suspend fun downloadManifest(): Reader {
    val response = fetch(url, "GET").await(httpClient)
    if (!response.isSuccessful) {
      throw Exception("Failed to open app.\n\nIf you are trying to load the app from a development server, check your network connectivity and make sure you can access the server from your device.\n\nIf you are trying to open a published project, install a compatible version of expo-updates and follow all setup and integration steps.")
    }
    return response.body()!!.charStream()
  }

  suspend fun parseManifest(): DevLauncherManifest {
    downloadManifest().use {
      return DevLauncherManifest.fromJson(it)
    }
  }
}
