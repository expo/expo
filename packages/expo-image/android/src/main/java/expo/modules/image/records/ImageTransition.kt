package expo.modules.image.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class ImageTransition(
  @Field val duration: Int = 0
) : Record
