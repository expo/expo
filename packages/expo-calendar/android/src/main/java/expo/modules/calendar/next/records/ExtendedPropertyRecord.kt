package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class ExtendedPropertyRecord(
  @Field val name: String,
  @Field val value: String
) : Record
