package expo.modules.filesystem.next

import expo.modules.filesystem.FileSystemUploadType
import expo.modules.filesystem.HttpMethod
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CreateOptions(
  @Field
  val intermediates: Boolean = false,
  @Field
  val overwrite: Boolean = false
) : Record

data class UploadOptions(
  @Field
  val headers: Map<String, String>?,
  @Field
  val httpMethod: HttpMethod = HttpMethod.POST,
  @Field
  val uploadType: FileSystemUploadType = FileSystemUploadType.MULTIPART,
  @Field
  val fieldName: String = "file",
  @Field
  val mimeType: String?
) : Record
