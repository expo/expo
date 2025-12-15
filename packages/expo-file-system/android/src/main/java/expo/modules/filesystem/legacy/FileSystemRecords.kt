package expo.modules.filesystem.legacy

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

data class InfoOptionsLegacy(
  @Field
  val md5: Boolean?
) : Record

data class DeletingOptions(
  @Field
  val idempotent: Boolean = false
) : Record

data class ReadingOptions(
  @Field
  val encoding: EncodingType = EncodingType.UTF8,
  @Field
  val position: Int?,
  @Field
  val length: Int?
) : Record

enum class EncodingType(val value: String) : Enumerable {
  UTF8("utf8"),
  BASE64("base64")
}

enum class SessionType(val value: Int) : Enumerable {
  BACKGROUND(0),
  FOREGROUND(1)
}

enum class FileSystemUploadType(val value: Int) : Enumerable {
  BINARY_CONTENT(0),
  MULTIPART(1)
}

data class MakeDirectoryOptions(
  @Field
  val intermediates: Boolean = false
) : Record

data class RelocatingOptions(
  @Field
  val from: String,
  @Field
  val to: String
) : Record

data class DownloadOptionsLegacy(
  @Field
  val md5: Boolean = false,
  @Field
  val cache: Boolean?,
  @Field
  val headers: Map<String, String>?,
  @Field
  val sessionType: SessionType = SessionType.BACKGROUND
) : Record

data class WritingOptions(
  @Field
  val encoding: EncodingType = EncodingType.UTF8
) : Record

data class FileSystemUploadOptions(
  @Field
  val headers: Map<String, String>?,
  @Field
  val httpMethod: HttpMethod = HttpMethod.POST,
  @Field
  val sessionType: SessionType = SessionType.BACKGROUND,
  @Field
  val uploadType: FileSystemUploadType,
  @Field
  val fieldName: String?,
  @Field
  val mimeType: String?,
  @Field
  val parameters: Map<String, String>?
) : Record

enum class HttpMethod(val value: String) : Enumerable {
  POST("POST"),
  PUT("PUT"),
  PATCH("PATCH")
}
