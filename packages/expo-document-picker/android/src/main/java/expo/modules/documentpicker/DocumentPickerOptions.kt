package expo.modules.documentpicker

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class DocumentPickerOptions(
  @Field
  val copyToCacheDirectory: Boolean,

  @Field
  val type: List<String>,

  @Field
  val multiple: Boolean
) : Record
