package abi48_0_0.expo.modules.medialibrary

import abi48_0_0.expo.modules.kotlin.records.Field
import abi48_0_0.expo.modules.kotlin.records.Record

data class AssetsOptions(
  @Field val first: Double,
  @Field val after: String?,
  @Field val album: String?,
  @Field val sortBy: List<String>,
  @Field val mediaType: List<String>,
  @Field val createdAfter: Double?,
  @Field val createdBefore: Double?
) : Record
