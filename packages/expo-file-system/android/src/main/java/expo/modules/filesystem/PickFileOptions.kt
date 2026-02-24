package expo.modules.filesystem

import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class PickFileOptions(
  @Field
  val initialUri: Uri?,
  @Field
  val mimeType: String?,
  @Field
  val multipleFiles: Boolean?
) : Record
