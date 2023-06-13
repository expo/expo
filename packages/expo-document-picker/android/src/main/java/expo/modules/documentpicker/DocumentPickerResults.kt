package expo.modules.documentpicker

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class DocumentPickerResult(
  @Field
  val canceled: Boolean = false,

  @Field
  val assets: List<DocumentInfo>? = null
) : Record

data class DocumentInfo(
  @Field
  val uri: String,

  @Field
  val name: String,

  @Field
  val mimeType: String?,

  @Field
  val size: Int?
) : Record
