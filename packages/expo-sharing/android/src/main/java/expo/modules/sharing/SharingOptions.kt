package expo.modules.sharing

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class SharingOptions(
  @Field val mimeType: String?,
  @Field val UTI: String?,
  @Field val dialogTitle: String?
) : Record
