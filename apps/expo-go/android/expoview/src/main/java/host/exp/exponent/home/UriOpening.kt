package host.exp.exponent.home

import androidx.compose.ui.platform.UriHandler

private const val DEV_CLIENT_SCHEME_PREFIX = "exp+"
private const val DEV_CLIENT_HOST = "expo-development-client"

internal fun openUriOrShowError(handler: UriHandler, uri: String, showError: (String) -> Unit) {
  try {
    handler.openUri(uri)
  } catch (e: IllegalArgumentException) {
    showError(unopenableUriMessage(uri))
  }
}

private fun unopenableUriMessage(uri: String): String {
  val scheme = uri.substringBefore("://")
  val host = uri.substringAfter("://").substringBefore("/").substringBefore("?")
  if (scheme.startsWith(DEV_CLIENT_SCHEME_PREFIX) && host == DEV_CLIENT_HOST) {
    val slug = scheme.removePrefix(DEV_CLIENT_SCHEME_PREFIX)
    return "This link is for a development build of \"$slug\", not Expo Go. Press s in the terminal running `npx expo start` to switch to Expo Go, then scan the new QR code."
  }
  return "Expo Go couldn't open $uri because no app on this device can handle it. Check the URL and try again."
}
