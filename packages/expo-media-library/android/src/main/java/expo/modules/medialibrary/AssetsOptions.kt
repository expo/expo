package expo.modules.medialibrary

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class AssetsOptions(
  @Field val first: Int?,
  @Field val after: String?,
  @Field val album: String?,
  @Field val sortBy: List<String>,
  @Field val mediaType: List<String>,
  @Field val createdAfter: Int?,
  @Field val createdBefore: Int?
) : Record
