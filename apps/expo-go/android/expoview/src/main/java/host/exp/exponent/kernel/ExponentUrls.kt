// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.net.Uri
import expo.modules.jsonutils.require
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.ExponentManifest
import okhttp3.Request
import org.json.JSONObject
import java.net.URI

object ExponentUrls {
  private val HTTPS_HOSTS = setOf(
    "exp.host",
    "exponentjs.com",
    "u.expo.dev",
    "staging-u.expo.dev"
  )

  private fun isHttpsHost(host: String?): Boolean {
    return HTTPS_HOSTS.contains(host)
  }

  @JvmStatic fun toHttp(rawUrl: String): String {
    if (rawUrl.startsWith("http")) {
      return rawUrl
    }
    val uri = Uri.parse(rawUrl)
    val useHttps = isHttpsHost(uri.host) || rawUrl.startsWith("exps")
    return uri.buildUpon().scheme(if (useHttps) "https" else "http").build().toString()
  }

  @JvmStatic fun resolveManifestUrl(rawUrl: String, manifestUrl: String): String {
    val baseUrl = ExponentManifest.httpManifestUrl(manifestUrl).toString()
    return try {
      URI(baseUrl).resolve(rawUrl).toString()
    } catch (e: Exception) {
      rawUrl
    }
  }

  /**
   * The HTTP(S) URL the JS bundle is loaded from, resolved against the URL the manifest was served
   * from.
   *
   * This is the address the device actually reached, so it's what other development server requests
   * must be built from. It's preferred over the manifest's `debuggerHost`, which holds the address
   * the development server believes it has, and which is unreachable whenever the server is reached
   * through something it can't observe, such as a proxy or a tunnel.
   */
  @JvmStatic fun bundleUrlFromManifest(manifest: Manifest, manifestUrl: String): String {
    return toHttp(resolveManifestUrl(manifest.getBundleURL(), manifestUrl))
  }

  @JvmStatic fun addExponentHeadersToUrl(urlString: String): Request.Builder {
    // TODO: set user agent
    val builder = Request.Builder()
      .url(urlString)
      .header("Exponent-SDK-Version", Constants.SDK_VERSION)
      .header("Exponent-Platform", "android")
    val versionName = ExpoViewKernel.instance.versionName
    if (versionName != null) {
      builder.header("Exponent-Version", versionName)
    }
    return builder
  }

  fun Request.Builder.addHeadersFromJSONObject(headers: JSONObject?): Request.Builder {
    if (headers == null) {
      return this
    }

    headers.keys().asSequence().forEach { key ->
      header(key, headers.require<Any>(key).toString())
    }
    return this
  }
}
