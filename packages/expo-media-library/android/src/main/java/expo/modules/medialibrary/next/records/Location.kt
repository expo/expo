package expo.modules.medialibrary.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Location(
  @Field val latitude: Double?,
  @Field val longitude: Double?
) : Record
