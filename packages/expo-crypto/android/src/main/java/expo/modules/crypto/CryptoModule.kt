package expo.modules.crypto

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest

class CryptoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoCrypto")

    AsyncFunction("digestStringAsync") { algorithm: DigestAlgorithm, data: String, options: DigestOptions ->
      val messageDigest = MessageDigest.getInstance(algorithm.value).apply { update(data.toByteArray()) }

      val digest: ByteArray = messageDigest.digest()
      return@AsyncFunction when (options.encoding) {
        DigestOptions.Encoding.BASE64 -> {
          Base64.encodeToString(digest, Base64.NO_WRAP)
        }
        DigestOptions.Encoding.HEX -> {
          digest.joinToString(separator = "") { byte ->
            ((byte.toInt() and 0xff) + 0x100)
              .toString(radix = 16)
              .substring(startIndex = 1)
          }
        }
      }
    }
  }
}
