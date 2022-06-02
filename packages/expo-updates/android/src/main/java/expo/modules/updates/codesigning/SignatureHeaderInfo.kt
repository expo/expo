package expo.modules.updates.codesigning

import expo.modules.structuredheaders.Parser
import expo.modules.structuredheaders.StringItem

const val CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_SIGNATURE = "sig"
const val CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_KEY_ID = "keyid"
const val CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_ALGORITHM = "alg"

data class SignatureHeaderInfo(val signature: String, val keyId: String, val algorithm: CodeSigningAlgorithm) {
  companion object {
    fun parseSignatureHeader(signatureHeader: String): SignatureHeaderInfo {
      val signatureMap = Parser(signatureHeader).parseDictionary().get()

      val sigFieldValue = signatureMap[CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_SIGNATURE]
      val keyIdFieldValue = signatureMap[CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_KEY_ID]
      val algFieldValue = signatureMap[CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_ALGORITHM]

      val signature = if (sigFieldValue is StringItem) {
        sigFieldValue.get()
      } else throw Exception("Structured field $CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_SIGNATURE not found in expo-signature header")
      val keyId = if (keyIdFieldValue is StringItem) {
        keyIdFieldValue.get()
      } else CODE_SIGNING_METADATA_DEFAULT_KEY_ID
      val alg = if (algFieldValue is StringItem) {
        algFieldValue.get()
      } else null

      return SignatureHeaderInfo(signature, keyId, CodeSigningAlgorithm.parseFromString(alg))
    }
  }
}
