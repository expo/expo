// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.annotation.SuppressLint
import android.security.keystore.KeyProperties
import android.util.Base64
import host.exp.exponent.network.ExpoHttpCallback
import host.exp.exponent.network.ExpoResponse
import host.exp.exponent.network.ExponentNetwork
import okhttp3.CacheControl
import okhttp3.Request
import java.io.IOException
import java.security.*
import java.security.spec.InvalidKeySpecException
import java.security.spec.X509EncodedKeySpec
import javax.crypto.BadPaddingException
import javax.crypto.IllegalBlockSizeException
import javax.crypto.NoSuchPaddingException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class Crypto @Inject constructor(var mExponentNetwork: ExponentNetwork) {
  interface RSASignatureListener {
    fun onError(errorMessage: String?, isNetworkError: Boolean)
    fun onCompleted(isValid: Boolean)
  }

  fun verifyPublicRSASignature(
    publicKeyUrl: String,
    plainText: String,
    cipherText: String,
    listener: RSASignatureListener
  ) {
    fetchPublicKeyAndVerifyPublicRSASignature(
      true,
      publicKeyUrl,
      plainText,
      cipherText,
      listener
    )
  }

  // On first attempt use cache. If verification fails try a second attempt without
  // cache in case the keys were actually rotated.
  // On second attempt reject promise if it fails.
  private fun fetchPublicKeyAndVerifyPublicRSASignature(
    isFirstAttempt: Boolean,
    publicKeyUrl: String,
    plainText: String,
    cipherText: String,
    listener: RSASignatureListener
  ) {
    val cacheControl = if (isFirstAttempt) {
      CacheControl.FORCE_CACHE
    } else {
      CacheControl.FORCE_NETWORK
    }
    val request = Request.Builder()
      .url(publicKeyUrl)
      .cacheControl(cacheControl)
      .build()
    mExponentNetwork.client.call(
      request,
      object : ExpoHttpCallback {
        override fun onFailure(e: IOException) {
          listener.onError(e.toString(), true)
        }

        @Throws(IOException::class)
        override fun onResponse(response: ExpoResponse) {
          val errorMessage: String = try {
            val isValid =
              verifyPublicRSASignature(response.body().string(), plainText, cipherText)
            listener.onCompleted(isValid)
            return
          } catch (e: NoSuchPaddingException) {
            "Error with RSA key."
          } catch (e: NoSuchAlgorithmException) {
            "Error with RSA key."
          } catch (e: InvalidKeySpecException) {
            "Error verifying."
          } catch (e: InvalidKeyException) {
            "Error verifying."
          } catch (e: BadPaddingException) {
            "Error verifying."
          } catch (e: IllegalBlockSizeException) {
            "Error verifying."
          } catch (e: Exception) {
            "Error verifying."
          }
          if (isFirstAttempt) {
            fetchPublicKeyAndVerifyPublicRSASignature(
              false,
              publicKeyUrl,
              plainText,
              cipherText,
              listener
            )
          } else {
            listener.onError(errorMessage, false)
          }
        }
      }
    )
  }

  @Throws(
    NoSuchPaddingException::class,
    NoSuchAlgorithmException::class,
    InvalidKeySpecException::class,
    InvalidKeyException::class,
    BadPaddingException::class,
    IllegalBlockSizeException::class,
    SignatureException::class
  )
  private fun verifyPublicRSASignature(
    publicKey: String,
    plainText: String,
    cipherText: String
  ): Boolean {
    // remove comments
    val publicKeySplit = publicKey.split("\\r?\\n")
    var publicKeyNoComments = ""
    for (line in publicKeySplit) {
      if (!line.contains("PUBLIC KEY-----")) {
        publicKeyNoComments += line + "\n"
      }
    }
    val signature = Signature.getInstance("SHA256withRSA")
    val decodedPublicKey = Base64.decode(publicKeyNoComments, Base64.DEFAULT)
    val publicKeySpec = X509EncodedKeySpec(decodedPublicKey)
    @SuppressLint("InlinedApi") val keyFactory =
      KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_RSA)
    val key = keyFactory.generatePublic(publicKeySpec)
    signature.initVerify(key)
    signature.update(plainText.toByteArray())
    return signature.verify(Base64.decode(cipherText, Base64.DEFAULT))
  }
}
