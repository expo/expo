package expo.modules.crypto

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

class DigestOptions : Record {
  @Field
  var encoding: Encoding = Encoding.HEX

  enum class Encoding(val value: String) : Enumerable {
    HEX("hex"),
    BASE64("base64")
  }
}
