package com.facebook.react.devsupport

import android.content.Context
import android.net.Uri
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface

class DevLauncherDevServerHelper(
  context: Context,
  private val controller: DevLauncherControllerInterface?,
  devSettings: DeveloperSettings,
  packagerConnection: PackagerConnectionSettings
) :
  DevServerHelper(devSettings, context.packageName, packagerConnection) {

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
}
