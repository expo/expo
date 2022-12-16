package expo.modules.crypto

// These are the expected results for the following encoding for text "Expo"
val expectedEncodingResults = mapOf(
  DigestOptions.Encoding.HEX to mapOf(
    DigestAlgorithm.SHA1 to "c275355dc46ac171633935033d113e3872d595e5",
    DigestAlgorithm.SHA256 to "f5e5cae536b49d394e1e72d4368d64b00a23298ec5ae11f3a9102a540e2532dc",
    DigestAlgorithm.SHA384 to "aa356c88afdbd8a7a5a9c3133541af0035e4b04e82438a223aa1939240ccb6b3ca28294b5ac0f42703b15183f4c016fc",
    DigestAlgorithm.SHA512 to "f1924f3e61aac4e4caa7fd566591b8abb541b0e642cd7bf0c71573267cfacf1b6dafe905bd6e42633bfba67c59774e070095e19a7c2078ac18ccd23245d76f1c",
    DigestAlgorithm.MD5 to "c29f23f279126757ba18ec74d0d27cfa"
  ),
  DigestOptions.Encoding.BASE64 to mapOf(
    DigestAlgorithm.SHA1 to "wnU1XcRqwXFjOTUDPRE+OHLVleU=",
    DigestAlgorithm.SHA256 to "9eXK5Ta0nTlOHnLUNo1ksAojKY7FrhHzqRAqVA4lMtw=",
    DigestAlgorithm.SHA384 to "qjVsiK/b2KelqcMTNUGvADXksE6CQ4oiOqGTkkDMtrPKKClLWsD0JwOxUYP0wBb8",
    DigestAlgorithm.SHA512 to "8ZJPPmGqxOTKp/1WZZG4q7VBsOZCzXvwxxVzJnz6zxttr+kFvW5CYzv7pnxZd04HAJXhmnwgeKwYzNIyRddvHA==",
    DigestAlgorithm.MD5 to "wp8j8nkSZ1e6GOx00NJ8+g=="
  )
)
