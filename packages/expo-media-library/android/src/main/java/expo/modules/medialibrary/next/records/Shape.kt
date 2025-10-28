package expo.modules.medialibrary.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Shape(
  @Field val width: Int,
  @Field val height: Int
) : Record
