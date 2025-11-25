package expo.modules.crypto.aes.enums

import expo.modules.kotlin.types.Enumerable

enum class KeyEncoding(val value: String): Enumerable {
  BASE64("base64"),
  HEX("hex")
}
