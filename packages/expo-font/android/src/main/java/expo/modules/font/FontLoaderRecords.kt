package expo.modules.font

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class FontFaceRecord(
  @Field
  val localUri: String = "",

  @Field
  val weight: Int? = null,

  @Field
  val style: String? = null
) : Record
