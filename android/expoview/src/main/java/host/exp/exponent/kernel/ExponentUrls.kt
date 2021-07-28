// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.net.Uri
import android.os.Build
import host.exp.exponent.Constants
import okhttp3.Request

object ExponentUrls {
  private val HTTPS_HOSTS = setOf(
    "exp.host",
    "exponentjs.com"
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
      .header("Exponent-SDK-Version", Constants.SDK_VERSIONS)
      .header("Exponent-Platform", "android")
    val versionName = ExpoViewKernel.instance.versionName
    if (versionName != null) {
      builder.header("Exponent-Version", versionName)
    }
    return builder
  }

  @JvmStatic fun addExponentHeadersToManifestUrl(
    urlString: String,
    isShellAppManifest: Boolean,
    sessionSecret: String?
  ): Request.Builder {
    val builder = addExponentHeadersToUrl(urlString)
      .header("Accept", "application/expo+json,application/json")
    if (KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES) {
      builder.header("Exponent-SDK-Version", "UNVERSIONED")
    }
    val clientEnvironment: String = if (isShellAppManifest) {
      builder.header("Expo-Release-Channel", Constants.RELEASE_CHANNEL)
      "STANDALONE"
    } else {
      if (Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")) "EXPO_SIMULATOR" else "EXPO_DEVICE"
    }
    builder.header("Expo-Api-Version", "1")
      .header("Expo-Client-Environment", clientEnvironment)
    if (sessionSecret != null) {
      builder.header("Expo-Session", sessionSecret)
    }
    return builder
  }
}
