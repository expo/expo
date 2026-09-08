package expo.modules.devlauncher.helpers

import android.net.Uri

fun replaceEXPScheme(uri: Uri, scheme: String): Uri = if (uri.scheme == "exp") uri.buildUpon().scheme(scheme).build() else uri

fun isDevLauncherUrl(uri: Uri) = uri.host == "expo-development-client"

fun hasUrlQueryParam(uri: Uri): Boolean {
  return uri.getQueryParameter("url") != null
}

class DevLauncherUrl(var url: Uri) {
  val queryParams = mutableMapOf<String, String>()
  val initialUrl: Uri?

  init {
    url.queryParameterNames.forEach { name ->
      queryParams[name] = url.getQueryParameter(name) ?: ""
    }

    initialUrl = (queryParams["initialUrl"] ?: queryParams["initialURL"])
      ?.takeIf { it.isNotEmpty() }
      ?.let(Uri::parse)

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
