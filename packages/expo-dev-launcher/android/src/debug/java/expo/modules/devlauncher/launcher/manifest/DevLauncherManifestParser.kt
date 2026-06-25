package expo.modules.devlauncher.launcher.manifest

import android.net.Uri
import expo.modules.devlauncher.helpers.await
import expo.modules.devlauncher.helpers.fetch
import expo.modules.manifests.core.Manifest
import okhttp3.Headers
import okhttp3.Headers.Companion.toHeaders
import okhttp3.OkHttpClient
import org.json.JSONArray
import org.json.JSONObject
import java.io.Reader
import java.net.URI

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
      return Manifest.fromManifestJson(resolveManifestUrls(JSONObject(it.readText())))
    }
  }

  private fun resolveManifestUrls(manifestJson: JSONObject): JSONObject {
    if (manifestJson.has("bundleUrl")) {
      manifestJson.put("bundleUrl", resolveUrl(manifestJson.getString("bundleUrl")))
    }

    manifestJson.optJSONObject("launchAsset")?.let { launchAsset ->
      launchAsset.put("url", resolveUrl(launchAsset.getString("url")))
    }

    manifestJson.optJSONArray("assets")?.resolveAssetUrls()
    return manifestJson
  }

  private fun JSONArray.resolveAssetUrls() {
    for (i in 0 until length()) {
      val asset = getJSONObject(i)
      asset.put("url", resolveUrl(asset.getString("url")))
    }
  }

  private fun resolveUrl(rawUrl: String): String {
    return URI(url.toString()).resolve(rawUrl).toString()
  }

  private fun getHeaders(): Headers {
    val headersMap = mutableMapOf(
      "expo-platform" to "android",
      "accept" to "application/expo+json,application/json"
    )
    headersMap.putAll(getForwardedHeaders(url))
    if (installationID != null) {
      headersMap["expo-dev-client-id"] = installationID
    }
    return headersMap.toHeaders()
  }

  private fun getForwardedHeaders(url: Uri): Map<String, String> {
    val authority = url.encodedAuthority ?: return emptyMap()
    val scheme = url.scheme ?: return emptyMap()
    return mutableMapOf(
      "forwarded" to "host=\"$authority\";proto=$scheme",
      "x-forwarded-host" to authority,
      "x-forwarded-proto" to scheme
    )
  }
}
