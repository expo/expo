package abi47_0_0.expo.modules.crypto

import abi47_0_0.expo.modules.kotlin.records.Field
import abi47_0_0.expo.modules.kotlin.records.Record
import abi47_0_0.expo.modules.kotlin.types.Enumerable

class DigestOptions : Record {
  @Field
  var encoding: Encoding = Encoding.HEX

  enum class Encoding(val value: String) : Enumerable {
    HEX("hex"),
    BASE64("base64")
  }
}
