package abi48_0_0.expo.modules.documentpicker

import abi48_0_0.expo.modules.kotlin.records.Field
import abi48_0_0.expo.modules.kotlin.records.Record

data class DocumentPickerResult(
  @Field
  val type: String,

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
)
