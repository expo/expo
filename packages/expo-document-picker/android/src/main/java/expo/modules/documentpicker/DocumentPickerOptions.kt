package expo.modules.documentpicker

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.IsNotEmpty
import expo.modules.kotlin.records.Record

data class DocumentPickerOptions(
  @Field
  val copyToCacheDirectory: Boolean,

  @Field
  @IsNotEmpty
  val type: List<String>,

  @Field
  val multiple: Boolean
) : Record
