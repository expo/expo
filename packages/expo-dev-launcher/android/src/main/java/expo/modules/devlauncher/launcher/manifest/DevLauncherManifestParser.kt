package expo.modules.devlauncher.launcher.manifest

import android.net.Uri
import expo.modules.devlauncher.helpers.await
import expo.modules.devlauncher.helpers.fetch
import expo.modules.manifests.core.Manifest
import okhttp3.Headers
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.io.Reader

class DevLauncherManifestParser(
  private val httpClient: OkHttpClient,
  private val url: Uri,
  private val installationID: String?
) {
  suspend fun isManifestUrl(): Boolean {
    val response = fetch(url, "HEAD", getHeaders()).await(httpClient)
    val contentType = response.header("Content-Type")
    // published projects may respond unsuccessfully to HEAD requests sent with no headers
    return !response.isSuccessful ||
      response.header("Exponent-Server", null) != null ||
      (contentType != null && !contentType.startsWith("text/html") && !contentType.contains("/javascript"))
  }

  private suspend fun downloadManifest(): Reader {
    val response = fetch(url, "GET", getHeaders()).await(httpClient)
    if (!response.isSuccessful) {
      throw Exception("Failed to open app.\n\nIf you are trying to load the app from a development server, check your network connectivity and make sure you can access the server from your device.\n\nIf you are trying to open a published project, install a compatible version of expo-updates and follow all setup and integration steps.")
    }
    @Suppress("DEPRECATION_ERROR")
    return response.body()!!.charStream()
  }

  suspend fun parseManifest(): Manifest {
    downloadManifest().use {
      return Manifest.fromManifestJson(JSONObject(it.readText()))
    }
  }

  private fun getHeaders(): Headers {
    val headersMap = mutableMapOf("expo-platform" to "android")
    if (installationID != null) {
      headersMap["expo-dev-client-id"] = installationID
    }
    return Headers.of(headersMap)
  }
}
