package expo.modules.filesystem

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class InfoOptions(
  @Field
  val md5: Boolean?
) : Record

@OptimizedRecord
data class CreateOptions(
  @Field
  val intermediates: Boolean = false,
  @Field
  val overwrite: Boolean = false,
  @Field
  val idempotent: Boolean = false
) : Record

enum class EncodingType(val value: String) : Enumerable {
  UTF8("utf8"),
  BASE64("base64")
}

@OptimizedRecord
data class WriteOptions(
  @Field
  val encoding: EncodingType = EncodingType.UTF8,
  @Field
  val append: Boolean = false
) : Record

@OptimizedRecord
data class DownloadOptions(
  @Field
  val headers: Map<String, String> = emptyMap(),
  @Field
  val idempotent: Boolean = false
) : Record

@OptimizedRecord
data class RelocationOptions(
  @Field
  val overwrite: Boolean = false
) : Record

@OptimizedRecord
data class FileInfo(
  @Field var exists: Boolean,
  @Field var uri: String?,
  @Field var md5: String? = null,
  @Field var size: Long? = null,
  @Field var modificationTime: Long? = null,
  @Field var creationTime: Long? = null
) : Record

@OptimizedRecord
data class PathInfo(
  @Field var exists: Boolean,
  @Field var isDirectory: Boolean?
) : Record

@OptimizedRecord
data class DirectoryInfo(
  @Field var exists: Boolean,
  @Field var uri: String?,
  @Field var files: List<String>? = null,
  @Field var md5: String? = null,
  @Field var size: Long? = null,
  @Field var modificationTime: Long? = null,
  @Field var creationTime: Long? = null
) : Record

enum class CompressionLevelEnum(val value: Int) : Enumerable {
  NONE(0),
  BEST_SPEED(1),
  DEFAULT(-1),
  BEST_COMPRESSION(9)
}

data class ZipOptions(
  @Field
  val includeRootDirectory: Boolean = true,
  @Field
  val compressionLevel: CompressionLevelEnum = CompressionLevelEnum.DEFAULT,
  @Field
  val overwrite: Boolean = true
) : Record

data class UnzipOptions(
  @Field
  val createContainingDirectory: Boolean = false,
  @Field
  val overwrite: Boolean = true
) : Record

data class ZipEntryRecord(
  @Field val name: String,
  @Field val isDirectory: Boolean,
  @Field val size: Long,
  @Field val compressedSize: Long,
  @Field val crc32: Long? = null,
  @Field val lastModified: Long? = null,
  @Field val compressionMethod: String? = null
) : Record
