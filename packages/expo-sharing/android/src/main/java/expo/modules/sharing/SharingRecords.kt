package expo.modules.sharing

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

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
        mimeType.startsWith("text/") -> Text
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

internal data class SharePayload(
  @Field var value: String = "",
  @Field var shareType: ShareType = ShareType.Text,
  @Field var mimeType: String = "text/plain"
) : Record

data class ResolvedSharePayload(
  @Field var value: String = "",
  @Field var shareType: ShareType = ShareType.Text,
  @Field var mimeType: String = "text/plain",
  @Field var contentUri: String? = null,
  @Field var contentType: ContentType? = null,
  @Field var contentSize: Long? = null,
  @Field var contentMimeType: String? = null,
  @Field var originalName: String? = null
) : Record
