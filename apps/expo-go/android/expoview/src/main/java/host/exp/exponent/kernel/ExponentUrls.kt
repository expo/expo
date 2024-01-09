// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.net.Uri
import expo.modules.jsonutils.require
import host.exp.exponent.Constants
import okhttp3.Request
import org.json.JSONObject

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
