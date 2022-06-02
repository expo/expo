package expo.modules.crypto

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class DigestOptions : Record {
  @Field
  var encoding: Encoding = Encoding.HEX

  enum class Encoding(val value: String) {
    HEX("hex"),
    BASE64("base64")
  }
}
