package expo.modules.sharing

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class SharingOptions(
  @Field val mimeType: String?,
  @Field val UTI: String?,
  @Field val dialogTitle: String?
) : Record
