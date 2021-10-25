package expo.modules.updates.loader

import android.annotation.SuppressLint
import android.security.keystore.KeyProperties
import android.util.Base64
import okhttp3.*
import java.io.IOException
import java.security.*
import java.security.spec.InvalidKeySpecException
import java.security.spec.X509EncodedKeySpec

object Crypto {
  private const val PUBLIC_KEY_URL = "https://exp.host/--/manifest-public-key"

  fun verifyPublicRSASignature(
    plainText: String,
    cipherText: String,
    fileDownloader: FileDownloader,
    listener: RSASignatureListener
  ) {
    fetchPublicKeyAndVerifyPublicRSASignature(true, plainText, cipherText, fileDownloader, listener)
  }

  // On first attempt use cache. If verification fails try a second attempt without
  // cache in case the keys were actually rotated.
  // On second attempt reject promise if it fails.
  private fun fetchPublicKeyAndVerifyPublicRSASignature(
    isFirstAttempt: Boolean,
    plainText: String,
    cipherText: String,
    fileDownloader: FileDownloader,
    listener: RSASignatureListener
  ) {
    val cacheControl = if (isFirstAttempt) CacheControl.FORCE_CACHE else CacheControl.FORCE_NETWORK
    val request = Request.Builder()
      .url(PUBLIC_KEY_URL)
      .cacheControl(cacheControl)
      .build()
    fileDownloader.downloadData(
      request,
      object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          listener.onError(e, true)
        }

        @Throws(IOException::class)
        override fun onResponse(call: Call, response: Response) {
          val exception: Exception = try {
            val isValid = verifyPublicRSASignature(
              response.body()!!.string(), plainText, cipherText
            )
            listener.onCompleted(isValid)
            return
          } catch (e: Exception) {
            e
          }
          if (isFirstAttempt) {
            fetchPublicKeyAndVerifyPublicRSASignature(
              false,
              plainText,
              cipherText,
              fileDownloader,
              listener
            )
          } else {
            listener.onError(exception, false)
          }
        }
      }
    )
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

  interface RSASignatureListener {
    fun onError(exception: Exception, isNetworkError: Boolean)
    fun onCompleted(isValid: Boolean)
  }
}
