package expo.modules.crypto

import expo.modules.kotlin.types.EnumArgument

enum class DigestAlgorithm(val value: String) : EnumArgument {
  MD5("MD5"),
  SHA1("SHA-1"),
  SHA256("SHA-256"),
  SHA384("SHA-384"),
  SHA512("SHA-512")
}
