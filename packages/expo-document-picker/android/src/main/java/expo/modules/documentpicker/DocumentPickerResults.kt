package expo.modules.documentpicker

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class DocumentPickerResult(
  @Field
  val type: String,

  @Field
  val result: List<DocumentPickerData> = emptyList()
) : Record

data class DocumentPickerData(
  @Field
  val uri: String,

  @Field
  val name: String,

  @Field
  val mimeType: String?,

  @Field
  val size: Int?
) : Record

data class DocumentPickerCancelled(
  @Field
  val type: String
) : Record
