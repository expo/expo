package abi49_0_0.expo.modules.crypto

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record
import abi49_0_0.expo.modules.kotlin.types.Enumerable

class DigestOptions : Record {
  @Field
  var encoding: Encoding = Encoding.HEX

  enum class Encoding(val value: String) : Enumerable {
    HEX("hex"),
    BASE64("base64")
  }
}
