package expo.modules.crypto

import android.content.Context
import android.util.Base64

import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod

import java.security.MessageDigest
import java.security.NoSuchAlgorithmException

class CryptoModule(context: Context) : ExportedModule(context) {
  override fun getName() = "ExpoCrypto"

  @ExpoMethod
  fun digestStringAsync(algorithm: String, data: String, options: Map<String, Any?>, promise: Promise) {
    val encoding = options["encoding"] as String?

    val messageDigest = try {
      MessageDigest.getInstance(algorithm).apply { update(data.toByteArray()) }
    } catch (e: NoSuchAlgorithmException) {
      promise.reject("ERR_CRYPTO_DIGEST", e)
      return
    }

    val digest: ByteArray = messageDigest.digest()
    when (encoding) {
      "base64" -> {
        val output = Base64.encodeToString(digest, Base64.NO_WRAP)
        promise.resolve(output)
      }
      "hex" -> {
        val output = digest.joinToString(separator = "") { byte ->
          ((byte.toInt() and 0xff) + 0x100)
            .toString(radix = 16)
            .substring(startIndex = 1)
        }
        promise.resolve(output)
      }
      else -> {
        promise.reject("ERR_CRYPTO_DIGEST", "Invalid encoding type provided.")
      }
    }
  }
}
