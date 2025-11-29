package expo.modules.crypto.aes.records

import expo.modules.crypto.aes.AesConfig.DEFAULT_IV_SIZE
import expo.modules.crypto.aes.AesConfig.DEFAULT_TAG_SIZE
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class SealedDataConfig(
  @Field val ivLength: Int = DEFAULT_IV_SIZE,
  @Field val tagLength: Int = DEFAULT_TAG_SIZE
): Record
