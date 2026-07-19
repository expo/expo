package expo.modules.devlauncher.compose.utils

import androidx.core.net.toUri
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

fun sanitizeUrlString(urlString: String): String? {
  var sanitizedUrl = urlString.trim()

  val decodedUrl = try {
    URLDecoder.decode(sanitizedUrl, StandardCharsets.UTF_8.toString())
  } catch (_: Exception) {
    sanitizedUrl
  }
  sanitizedUrl = decodedUrl

  if (!sanitizedUrl.contains("://")) {
    sanitizedUrl = "http://$sanitizedUrl"
  }

  return try {
    val uri = sanitizedUrl.toUri()
    if (uri.scheme != null && uri.host != null) {
      sanitizedUrl
    } else {
      null
    }
  } catch (_: Throwable) {
    null
  }
}
