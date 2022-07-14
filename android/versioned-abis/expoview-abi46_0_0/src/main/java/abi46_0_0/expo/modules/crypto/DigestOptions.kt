package abi46_0_0.expo.modules.crypto

import abi46_0_0.expo.modules.kotlin.records.Field
import abi46_0_0.expo.modules.kotlin.records.Record

class DigestOptions : Record {
  @Field
  var encoding: Encoding = Encoding.HEX

  enum class Encoding(val value: String) {
    HEX("hex"),
    BASE64("base64")
  }
}
