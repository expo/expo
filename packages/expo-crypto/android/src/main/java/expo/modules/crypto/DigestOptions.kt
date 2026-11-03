package expo.modules.crypto

import io.github.expo.modules.v2.Record

@Record
data class DigestOptions(
  val encoding: Encoding = Encoding.HEX
) {
  enum class Encoding(val value: String) {
    HEX("hex"),
    BASE64("base64")
  }
}
