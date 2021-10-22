package expo.modules.updates.loader

import android.annotation.SuppressLint
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import okhttp3.*
import java.io.IOException
import java.security.*
import java.security.cert.CertificateException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.InvalidKeySpecException
import java.security.spec.X509EncodedKeySpec

object Crypto {
  private const val EXPO_PUBLIC_KEY_URL = "https://exp.host/--/manifest-public-key"

  // ASN.1 path to the extended key usage info within a CERT
  private const val CODE_SIGNING_OID = "1.3.6.1.5.5.7.3.3"

  fun verifyExpoPublicRSASignature(
    fileDownloader: FileDownloader,
    data: String,
    signature: String,
    listener: RSASignatureListener
  ) {
    fetchExpoPublicKeyAndVerifyPublicRSASignature(true, data, signature, fileDownloader, listener)
  }

  // On first attempt use cache. If verification fails try a second attempt without
  // cache in case the keys were actually rotated.
  // On second attempt reject promise if it fails.
  private fun fetchExpoPublicKeyAndVerifyPublicRSASignature(
    isFirstAttempt: Boolean,
    plainText: String,
    cipherText: String,
    fileDownloader: FileDownloader,
    listener: RSASignatureListener
  ) {
    val cacheControl = if (isFirstAttempt) CacheControl.FORCE_CACHE else CacheControl.FORCE_NETWORK
    val request = Request.Builder()
      .url(EXPO_PUBLIC_KEY_URL)
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
            val isValid = verifyPublicRSASignature(response.body()!!.string(), plainText, cipherText)
            listener.onCompleted(isValid)
            return
          } catch (e: Exception) {
            e
          }
          if (isFirstAttempt) {
            fetchExpoPublicKeyAndVerifyPublicRSASignature(
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
  fun verifyPublicRSASignature(
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

  data class CodeSigningCertificate(private val certificateString: String) {
    val publicKey: PublicKey by lazy {
      val certificateFactory = CertificateFactory.getInstance("X.509")
      val certificate = certificateFactory.generateCertificate(certificateString.byteInputStream()) as X509Certificate
      certificate.checkValidity()

      val keyUsage = certificate.keyUsage
      if (keyUsage.isEmpty() || !keyUsage[0]) {
        throw CertificateException("X509v3 Key Usage: Digital Signature not present")
      }

      val extendedKeyUsage = certificate.extendedKeyUsage
      if (!extendedKeyUsage.contains(CODE_SIGNING_OID)) {
        throw CertificateException("X509v3 Extended Key Usage: Code Signing not present")
      }

      certificate.publicKey
    }
  }

  data class CodeSigningSignature(val signature: String)

  data class CodeSigningConfiguration(private val certificate: CodeSigningCertificate, private val signature: CodeSigningSignature) {
    fun verify(bytes: ByteArray): Boolean {
      return Signature.getInstance("SHA256withRSA").apply {
        initVerify(certificate.publicKey)
        update(bytes)
      }.verify(Base64.decode(signature.signature, Base64.DEFAULT))
    }
  }
}
