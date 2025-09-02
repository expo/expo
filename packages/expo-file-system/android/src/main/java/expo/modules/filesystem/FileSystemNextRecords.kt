package expo.modules.filesystem

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class InfoOptions(
  @Field
  val md5: Boolean?
) : Record

data class CreateOptions(
  @Field
  val intermediates: Boolean = false,
  @Field
  val overwrite: Boolean = false,
  @Field
  val idempotent: Boolean = false
) : Record

data class DownloadOptions(
  @Field
  val headers: Map<String, String> = emptyMap()
) : Record

data class FileInfo(
  @Field var exists: Boolean,
  @Field var uri: String?,
  @Field var md5: String? = null,
  @Field var size: Long? = null,
  @Field var modificationTime: Long? = null,
  @Field var creationTime: Long? = null
) : Record

data class PathInfo(
  @Field var exists: Boolean,
  @Field var isDirectory: Boolean?
) : Record

data class DirectoryInfo(
  @Field var exists: Boolean,
  @Field var uri: String?,
  @Field var files: List<String>? = null,
  @Field var md5: String? = null,
  @Field var size: Long? = null,
  @Field var modificationTime: Long? = null,
  @Field var creationTime: Long? = null
) : Record
