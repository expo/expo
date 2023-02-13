package abi48_0_0.expo.modules.sharing

import abi48_0_0.expo.modules.kotlin.records.Field
import abi48_0_0.expo.modules.kotlin.records.Record

data class SharingOptions(
  @Field val mimeType: String?,
  @Field val UTI: String?,
  @Field val dialogTitle: String?
) : Record
