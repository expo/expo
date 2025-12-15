package expo.modules.devlauncher.compose.utils

import android.net.Uri
import androidx.core.net.toUri
import java.net.URLEncoder

fun formatUpdateUrl(permalink: String, message: String): Uri {
  val updatePermalinkQuery = "url=${URLEncoder.encode(permalink, "UTF-8")}"
  val updateMessageQuery = "updateMessage=${URLEncoder.encode(message, "UTF-8")}"
  val updateUrl = "expo-dev-client://expo-development-client?$updatePermalinkQuery&$updateMessageQuery"
  return updateUrl.toUri()
}
