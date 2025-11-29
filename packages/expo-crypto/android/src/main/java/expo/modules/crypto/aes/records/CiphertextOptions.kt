package expo.modules.crypto.aes.records

import expo.modules.crypto.aes.enums.DataFormat
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CiphertextOptions(
  @Field val includeTag: Boolean = false,
  @Field val outputFormat: DataFormat = DataFormat.BYTES
): Record
