package expo.modules.devlauncher.helpers

import android.net.Uri

fun replaceEXPScheme(uri: Uri, scheme: String): Uri = if (uri.scheme == "exp") uri.buildUpon().scheme(scheme).build() else uri

fun isDevLauncherUrl(uri: Uri) = uri.host == "expo-development-client"

fun hasUrlQueryParam(uri: Uri): Boolean {
  return uri.getQueryParameter("url") != null
}

/**
 * Checks if the `<name>=1` flag was passed in any of the provided urls. The flags are accepted
 * both on the dev launcher url and on the url of the app that it opens.
 */
fun hasEnabledFlag(name: String, vararg urls: String?): Boolean {
  return urls.any { it?.contains("$name=1") == true }
}

class DevLauncherUrl(var url: Uri) {
  val queryParams = mutableMapOf<String, String>()

  init {
    url.queryParameterNames.forEach { name ->
      queryParams[name] = url.getQueryParameter(name) ?: ""
    }

    if (isDevLauncherUrl(url)) {
      if (queryParams["url"] != null) {
        val queryUrl = Uri.parse(queryParams["url"])
        url = replaceEXPScheme(queryUrl, "http")
      }
    } else {
      url = replaceEXPScheme(url, "http")
    }
  }
}
