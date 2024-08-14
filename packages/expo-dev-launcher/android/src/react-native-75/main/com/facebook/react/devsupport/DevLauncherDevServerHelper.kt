package com.facebook.react.devsupport

import android.content.Context
import android.net.Uri
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

private const val PACKAGER_OK_STATUS = "packager-status:running"
private const val HTTP_CONNECT_TIMEOUT_MS = 5000L
private const val PACKAGER_STATUS_ENDPOINT = "status"

class DevLauncherDevServerHelper(
  context: Context,
  private val controller: DevLauncherControllerInterface?,
  devSettings: DeveloperSettings,
  packagerConnection: PackagerConnectionSettings
) : DevServerHelper(devSettings, context, packagerConnection) {

  private val httpClient: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .connectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
      .readTimeout(0, TimeUnit.MILLISECONDS)
      .writeTimeout(0, TimeUnit.MILLISECONDS)
      .build()
  }

  override fun getDevServerBundleURL(jsModulePath: String?): String {
    return controller?.manifest?.getBundleURL() ?: super.getDevServerBundleURL(jsModulePath)
  }

  override fun getDevServerSplitBundleURL(jsModulePath: String?): String {
    return controller?.manifest?.getBundleURL() ?: super.getDevServerSplitBundleURL(jsModulePath)
  }

  override fun getSourceUrl(mainModuleName: String?): String {
    return controller?.manifest?.getBundleURL() ?: super.getSourceUrl(mainModuleName)
  }

  override fun getSourceMapUrl(mainModuleName: String?): String {
    val defaultValue = super.getSourceMapUrl(mainModuleName)
    val bundleURL = controller?.manifest?.getBundleURL()
      ?: return defaultValue

    val parsedURL = Uri.parse(bundleURL)
    val customOptions = parsedURL.queryParameterNames.mapNotNull { key ->
      if (key.startsWith("transform")) {
        key to requireNotNull(parsedURL.getQueryParameter(key))
      } else {
        null
      }
    }.ifEmpty {
      return defaultValue
    }

    val customOptionsString = customOptions.joinToString("&") { (key, value) ->
      "$key=$value"
    }
    return "$defaultValue&$customOptionsString"
  }

  /**
   * Re-implement [PackagerStatusCheck](https://github.com/facebook/react-native/blob/958f8e2bb55ba3a2ac/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/PackagerStatusCheck.java)
   * to support https.
   */
  override fun isPackagerRunning(callback: PackagerStatusCallback) {
    val bundleURL = controller?.manifest?.getBundleURL() ?: return super.isPackagerRunning(callback)
    val bundleUri = Uri.parse(bundleURL)
    val statusUrl = bundleUri.buildUpon()
      .path(PACKAGER_STATUS_ENDPOINT)
      .clearQuery()
      .build()
      .toString()
    val request = Request.Builder().url(statusUrl).build()
    httpClient
      .newCall(request)
      .enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          callback.onPackagerStatusFetched(false)
        }

        override fun onResponse(call: Call, response: Response) {
          if (!response.isSuccessful) {
            callback.onPackagerStatusFetched(false)
            return
          }
          val body = response.body?.string() ?: ""
          callback.onPackagerStatusFetched(body == PACKAGER_OK_STATUS)
        }
      })
  }
}
