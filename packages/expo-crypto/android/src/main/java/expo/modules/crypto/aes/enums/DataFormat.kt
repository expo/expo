package expo.modules.crypto.aes.enums

import expo.modules.kotlin.types.Enumerable

enum class DataFormat(val value: String): Enumerable {
  BYTES("bytes"),
  BASE64("base64");
}
