package expo.modules.devlauncher.helpers

import android.net.Uri

fun replaceEXPScheme(uri: Uri, scheme: String): Uri = if (uri.scheme == "exp") uri.buildUpon().scheme(scheme).build() else uri

fun isDevLauncherUrl(uri: Uri) = uri.host == "expo-development-client"

fun getAppUrlFromDevLauncherUrl(uri: Uri): Uri? {
  if (uri.getQueryParameter("url") == null) {
    return null
  }

  return Uri.parse(uri.getQueryParameter("url"))
}
