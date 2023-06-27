package abi49_0_0.expo.modules.documentpicker

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.IsNotEmpty
import abi49_0_0.expo.modules.kotlin.records.Record

data class DocumentPickerOptions(
  @Field
  val copyToCacheDirectory: Boolean,

  @Field
  @IsNotEmpty
  val type: List<String>,

  @Field
  val multiple: Boolean
) : Record
