package expo.modules.crypto.aes.records

import expo.modules.crypto.aes.BinaryInput
import expo.modules.crypto.aes.enums.DataFormat
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class DecryptOptions : Record {
  @Field
  val output: DataFormat = DataFormat.BYTES

  @Field
  val additionalData: BinaryInput? = null
}
