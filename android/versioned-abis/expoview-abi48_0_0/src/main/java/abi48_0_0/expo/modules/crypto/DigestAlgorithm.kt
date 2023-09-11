package abi48_0_0.expo.modules.crypto

import abi48_0_0.expo.modules.kotlin.types.Enumerable

enum class DigestAlgorithm(val value: String) : Enumerable {
  MD5("MD5"),
  SHA1("SHA-1"),
  SHA256("SHA-256"),
  SHA384("SHA-384"),
  SHA512("SHA-512")
}
