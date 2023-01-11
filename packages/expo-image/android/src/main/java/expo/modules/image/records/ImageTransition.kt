package expo.modules.image.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class ImageTransition(
  @Field val duration: Int = 0
) : Record
