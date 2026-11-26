package expo.modules.sharing

import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Record

enum class ShareType(val value: String) : Enumerable {
  Text("text"),
  Url("url"),
  Audio("audio"),
  Image("image"),
  Video("video"),
  File("file");

  companion object {
    fun fromMimeType(mimeType: String): ShareType {
      return when {
        mimeType.startsWith("image/") -> Image
        mimeType.startsWith("video/") -> Video
        mimeType.startsWith("audio/") -> Audio
        else -> File
      }
    }
  }
}

enum class ContentType(val value: String) : Enumerable {
  Text("text"),
  Audio("audio"),
  Image("image"),
  Video("video"),
  File("file"),
  Website("website");

  companion object {
    fun fromMimeType(mimeType: String): ContentType {
      return when {
        mimeType.contains("text/html") || mimeType.contains("application/xhtml+xml") -> Website
        mimeType.startsWith("image/") -> Image
        mimeType.startsWith("video/") -> Video
        mimeType.startsWith("audio/") -> Audio
        mimeType.startsWith("text/") -> Text
        else -> File
      }
    }
  }
}

@Record
internal data class SharePayload(
  var value: String = "",
  var shareType: ShareType = ShareType.Text,
  var mimeType: String = "text/plain"
)

@Record
data class ResolvedSharePayload(
  var value: String = "",
  var shareType: ShareType = ShareType.Text,
  var mimeType: String = "text/plain",
  var contentUri: String? = null,
  var contentType: ContentType? = null,
  var contentSize: Long? = null,
  var contentMimeType: String? = null,
  var originalName: String? = null
)
