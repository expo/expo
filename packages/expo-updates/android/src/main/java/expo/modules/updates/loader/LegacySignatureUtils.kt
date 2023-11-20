package expo.modules.updates.loader

import android.annotation.SuppressLint
import android.security.keystore.KeyProperties
import android.util.Base64
import okhttp3.*
import java.io.IOException
import java.security.*
import java.security.spec.InvalidKeySpecException
import java.security.spec.X509EncodedKeySpec

private const val EXPO_PUBLIC_KEY_URL = "https://exp.host/--/manifest-public-key"

class RSAException(val isNetworkError: Boolean, cause: Exception) : Exception(cause)

data class RSASignatureResult(val isValid: Boolean)

suspend fun verifyExpoPublicRSASignature(
  fileDownloader: FileDownloader,
  data: String,
  signature: String,
): RSASignatureResult {
  return fetchExpoPublicKeyAndVerifyPublicRSASignature(true, data, signature, fileDownloader)
}

// On first attempt use cache. If verification fails try a second attempt without
// cache in case the keys were actually rotated.
// On second attempt reject promise if it fails.
private suspend fun fetchExpoPublicKeyAndVerifyPublicRSASignature(
  isFirstAttempt: Boolean,
  plainText: String,
  cipherText: String,
  fileDownloader: FileDownloader,
): RSASignatureResult {
  val cacheControl = if (isFirstAttempt) CacheControl.FORCE_CACHE else CacheControl.FORCE_NETWORK
  val request = Request.Builder()
    .url(EXPO_PUBLIC_KEY_URL)
    .cacheControl(cacheControl)
    .build()
  val response = try {
    fileDownloader.downloadData(request)
  } catch (e: IOException) {
    throw RSAException(true, e)
  }

  val exception: Exception = try {
    val isValid = verifyPublicRSASignature(response.body!!.string(), plainText, cipherText)
    return RSASignatureResult(isValid)
  } catch (e: Exception) {
    e
  }

  if (isFirstAttempt) {
    return fetchExpoPublicKeyAndVerifyPublicRSASignature(
      false,
      plainText,
      cipherText,
      fileDownloader,
    )
  } else {
    throw RSAException(false, exception)
  }
}

@Throws(
  NoSuchAlgorithmException::class,
  InvalidKeySpecException::class,
  InvalidKeyException::class,
  SignatureException::class
)
private fun verifyPublicRSASignature(
  publicKey: String,
  plainText: String,
  cipherText: String
): Boolean {
  // remove comments from public key
  val publicKeySplit = publicKey.split("\\r?\\n".toRegex()).toTypedArray()
  var publicKeyNoComments = ""
  for (line in publicKeySplit) {
    if (!line.contains("PUBLIC KEY-----")) {
      publicKeyNoComments += line + "\n"
    }
  }

  val signature = Signature.getInstance("SHA256withRSA")
  val decodedPublicKey = Base64.decode(publicKeyNoComments, Base64.DEFAULT)
  val publicKeySpec = X509EncodedKeySpec(decodedPublicKey)
  @SuppressLint("InlinedApi") val keyFactory = KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_RSA)
  val key = keyFactory.generatePublic(publicKeySpec)
  signature.initVerify(key)
  signature.update(plainText.toByteArray())
  return signature.verify(Base64.decode(cipherText, Base64.DEFAULT))
}
