package expo.modules.devlauncher.helpers

import android.net.Uri

fun changeUrlScheme(uri: Uri, scheme: String): Uri = uri.buildUpon().scheme(scheme).build()

fun isDevLauncherUrl(uri: Uri) = uri.host == "expo-development-client"

fun getAppUrlFromDevLauncherUrl(uri: Uri): Uri? {
  if (uri.getQueryParameter("url") == null) {
    return null
  }

  return Uri.parse(uri.getQueryParameter("url"))
}
