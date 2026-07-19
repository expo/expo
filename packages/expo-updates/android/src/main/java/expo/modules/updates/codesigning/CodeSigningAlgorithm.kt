package expo.modules.updates.codesigning

const val CODE_SIGNING_METADATA_ALGORITHM_KEY = "alg"
const val CODE_SIGNING_METADATA_KEY_ID_KEY = "keyid"

const val CODE_SIGNING_METADATA_DEFAULT_KEY_ID = "root"

enum class CodeSigningAlgorithm(val algorithmName: String) {
  RSA_SHA256("rsa-v1_5-sha256");

  companion object {
    fun parseFromString(str: String?): CodeSigningAlgorithm {
      return when (str) {
        RSA_SHA256.algorithmName -> RSA_SHA256
        null -> RSA_SHA256
        else -> throw Exception("Invalid code signing algorithm name: $str")
      }
    }
  }
}
