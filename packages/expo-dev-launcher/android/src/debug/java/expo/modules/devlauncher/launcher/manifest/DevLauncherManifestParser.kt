package expo.modules.devlauncher.launcher.manifest

import android.net.Uri
import expo.modules.devlauncher.helpers.await
import expo.modules.devlauncher.helpers.fetch
import expo.modules.manifests.core.Manifest
import okhttp3.Headers
import okhttp3.Headers.Companion.toHeaders
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
      // Surface the server-provided error instead of blaming connectivity: the dev
      // server reached us and answered, so this is not a networking failure. Expo CLI
      // responds with a JSON body ({"error": "..."}) explaining exactly what went
      // wrong (e.g. a code signing misconfiguration), which used to be discarded here.
      @Suppress("DEPRECATION_ERROR")
      val serverMessage = serverErrorMessageFromResponseBody(response.body()?.string())
      val message = if (serverMessage != null) {
        "The development server responded with status code ${response.code()}:\n\n$serverMessage"
      } else {
        "The development server responded with status code ${response.code()}.\n\nIf you are trying to load the app from a development server, check the server logs for errors.\n\nIf you are trying to open a published project, install a compatible version of expo-updates and follow all setup and integration steps."
      }
      throw Exception(message)
    }
    @Suppress("DEPRECATION_ERROR")
    return response.body()!!.charStream()
  }

  /**
   * Extract a human-readable error message from a dev server error response body.
   * Expo CLI returns JSON like {"error": "..."}; fall back to a short plain-text body.
   */
  private fun serverErrorMessageFromResponseBody(body: String?): String? {
    if (body.isNullOrBlank()) {
      return null
    }
    try {
      val json = JSONObject(body)
      val error = json.optString("error").ifEmpty { json.optString("message") }
      if (error.isNotEmpty()) {
        return error
      }
    } catch (_: Exception) {
      // not JSON — fall through to plain text handling
    }
    // Only use plain-text bodies that are short enough to be a message rather than an HTML page.
    if (body.length <= 1024 && !body.contains("<html")) {
      return body.trim()
    }
    return null
  }

  suspend fun parseManifest(): Manifest {
    downloadManifest().use {
      return Manifest.fromManifestJson(JSONObject(it.readText()))
    }
  }

  private fun getHeaders(): Headers {
    val headersMap = mutableMapOf(
      "expo-platform" to "android",
      "accept" to "application/expo+json,application/json"
    )
    if (installationID != null) {
      headersMap["expo-dev-client-id"] = installationID
    }
    return headersMap.toHeaders()
  }
}
