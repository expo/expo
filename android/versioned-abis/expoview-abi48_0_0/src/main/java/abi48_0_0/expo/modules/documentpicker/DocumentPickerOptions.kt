package abi48_0_0.expo.modules.documentpicker

import abi48_0_0.expo.modules.kotlin.records.Field
import abi48_0_0.expo.modules.kotlin.records.IsNotEmpty
import abi48_0_0.expo.modules.kotlin.records.Record

data class DocumentPickerOptions(
  @Field
  val copyToCacheDirectory: Boolean,

  @Field
  @IsNotEmpty
  val type: List<String>
) : Record
