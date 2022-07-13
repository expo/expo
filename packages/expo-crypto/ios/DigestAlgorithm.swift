// Copyright 2022-present 650 Industries. All rights reserved.

import CommonCrypto
import ExpoModulesCore

typealias DigestFunction = (
  _ data: UnsafeRawPointer?,
  _ len: UInt32,
  _ md: UnsafeMutablePointer<UInt8>?
) -> UnsafeMutablePointer<UInt8>?

internal enum DigestAlgorithm: String, EnumArgument {
  case md2 = "MD2"
  case md4 = "MD4"
  case md5 = "MD5"
  case sha1 = "SHA-1"
  case sha224 = "SHA-224"
  case sha256 = "SHA-256"
  case sha384 = "SHA-384"
  case sha512 = "SHA-512"

  var digestLength: Int32 {
    switch self {
    case .md2:
      return CC_MD2_DIGEST_LENGTH
    case .md4:
      return CC_MD4_DIGEST_LENGTH
    case .md5:
      return CC_MD5_DIGEST_LENGTH
    case .sha1:
      return CC_SHA1_DIGEST_LENGTH
    case .sha224:
      return CC_SHA224_DIGEST_LENGTH
    case .sha256:
      return CC_SHA256_DIGEST_LENGTH
    case .sha384:
      return CC_SHA384_DIGEST_LENGTH
    case .sha512:
      return CC_SHA512_DIGEST_LENGTH
    }
  }

  var digest: DigestFunction {
    switch self {
    case .md2:
      return CC_MD2
    case .md4:
      return CC_MD4
    case .md5:
      return CC_MD5
    case .sha1:
      return CC_SHA1
    case .sha224:
      return CC_SHA224
    case .sha256:
      return CC_SHA256
    case .sha384:
      return CC_SHA384
    case .sha512:
      return CC_SHA512
    }
  }
}
