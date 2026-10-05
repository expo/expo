package expo.modules.crypto

import android.util.Base64
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.TypedArray
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID
import kotlin.math.min

@ExpoModule("ExpoCrypto")
class CryptoModule : Module() {
  private val secureRandom by lazy { SecureRandom() }

  @JS
  fun digestString(
    algorithm: DigestAlgorithm,
    data: String,
    options: DigestOptions
  ): String {
    val messageDigest = MessageDigest
      .getInstance(algorithm.value)
      .apply { update(data.toByteArray()) }

    val digest = messageDigest.digest()
    return when (options.encoding) {
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

  @JS
  suspend fun digestStringAsync(
    algorithm: DigestAlgorithm,
    data: String,
    options: DigestOptions
  ): String = withContext(Dispatchers.Default) {
    digestString(algorithm, data, options)
  }

  @JS
  fun getRandomValues(typedArray: TypedArray) {
    val array = ByteArray(typedArray.byteLength)
    secureRandom.nextBytes(array)
    typedArray.write(
      buffer = array,
      position = 0,
      size = typedArray.byteLength
    )
  }

  @JS
  fun digest(
    algorithm: DigestAlgorithm,
    output: TypedArray,
    data: TypedArray
  ) {
    val messageDigest = MessageDigest
      .getInstance(algorithm.value)
      .apply { update(data.toDirectBuffer()) }

    val digest = messageDigest.digest()
    val outputLength = min(digest.size, output.byteLength)
    output.write(
      buffer = digest,
      position = 0,
      size = outputLength
    )
  }

  @JS
  fun randomUUID(): String = UUID.randomUUID().toString()
}
