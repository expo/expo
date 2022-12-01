package expo.modules.medialibrary

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class AssetsOptions(
  @Field val first: Double,
  @Field val after: String?,
  @Field val album: String?,
  @Field val sortBy: List<String>,
  @Field val mediaType: List<String>,
  @Field val createdAfter: Double?,
  @Field val createdBefore: Double?
) : Record
