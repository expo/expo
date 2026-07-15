package expo.modules.devlauncher.helpers

import android.net.Uri

fun replaceEXPScheme(uri: Uri, scheme: String): Uri = if (uri.scheme == "exp") uri.buildUpon().scheme(scheme).build() else uri

// Tunnel hosts (e.g. `*.exp.direct`) are served over TLS, so `exp://` tunnel URLs
// must map to `https` — matching the scheme the Expo CLI uses for tunnel manifest
// URLs — while LAN/localhost dev servers keep using `http`.
fun packagerScheme(uri: Uri): String = if (uri.host?.endsWith(".exp.direct") == true) "https" else "http"

fun isDevLauncherUrl(uri: Uri) = uri.host == "expo-development-client"

fun hasUrlQueryParam(uri: Uri): Boolean {
  return uri.getQueryParameter("url") != null
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
        url = replaceEXPScheme(queryUrl, packagerScheme(queryUrl))
      }
    } else {
      url = replaceEXPScheme(url, packagerScheme(url))
    }
  }
}
