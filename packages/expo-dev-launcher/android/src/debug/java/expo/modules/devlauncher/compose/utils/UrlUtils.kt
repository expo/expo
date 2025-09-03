package expo.modules.devlauncher.compose.utils

import androidx.core.net.toUri

fun validateUrl(url: String): Boolean {
  return try {
    val uri = url.toUri()
    uri.scheme != null && uri.host != null
  } catch (_: Throwable) {
    false
  }
}
