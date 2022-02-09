package expo.modules.updates.loader

import android.annotation.SuppressLint
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import expo.modules.structuredheaders.BooleanItem
import expo.modules.structuredheaders.Dictionary
import okhttp3.*
import java.io.IOException
import java.security.*
import java.security.cert.CertificateException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.InvalidKeySpecException
import java.security.spec.X509EncodedKeySpec
import expo.modules.structuredheaders.Parser
import expo.modules.structuredheaders.StringItem

object Crypto {
  private val TAG = Crypto::class.java.simpleName

  const val CODE_SIGNING_METADATA_ALGORITHM_KEY = "alg"
  const val CODE_SIGNING_METADATA_KEY_ID_KEY = "keyid"

  const val CODE_SIGNING_METADATA_DEFAULT_KEY_ID = "root"
  const val CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_SIGNATURE = "sig"
  const val CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_KEY_ID = "keyid"
  const val CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_ALGORITHM = "alg"

  private const val EXPO_PUBLIC_KEY_URL = "https://exp.host/--/manifest-public-key"

  // ASN.1 path to the extended key usage info within a CERT
  private const val CODE_SIGNING_OID = "1.3.6.1.5.5.7.3.3"

  suspend fun verifyExpoPublicRSASignature(
    fileDownloader: FileDownloader,
    data: String,
    signature: String,
  ): Boolean {
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
  ): Boolean {
    val cacheControl = if (isFirstAttempt) CacheControl.FORCE_CACHE else CacheControl.FORCE_NETWORK
    val request = Request.Builder()
      .url(EXPO_PUBLIC_KEY_URL)
      .cacheControl(cacheControl)
      .build()
    val response = fileDownloader.downloadData(request)
    val exception: Exception = try {
      return verifyPublicRSASignature(
        response.body()!!.string(), plainText, cipherText
      )
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
      throw exception
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

  data class CodeSigningConfiguration(private val certificateString: String, private val metadata: Map<String, String>?) {
    val embeddedCertificate: X509Certificate by lazy {
      val certificateFactory = CertificateFactory.getInstance("X.509")
      val certificate = certificateFactory.generateCertificate(certificateString.byteInputStream()) as X509Certificate
      certificate.checkValidity()

      val keyUsage: BooleanArray? = certificate.keyUsage
      if (keyUsage == null || keyUsage.isEmpty() || !keyUsage[0]) {
        throw CertificateException("X509v3 Key Usage: Digital Signature not present")
      }

      val extendedKeyUsage = certificate.extendedKeyUsage
      if (!extendedKeyUsage.contains(CODE_SIGNING_OID)) {
        throw CertificateException("X509v3 Extended Key Usage: Code Signing not present")
      }

      certificate
    }

    val algorithm: CodeSigningAlgorithm by lazy {
      CodeSigningAlgorithm.parseFromString(metadata?.get(CODE_SIGNING_METADATA_ALGORITHM_KEY))
    }

    val keyId: String by lazy {
      metadata?.get(CODE_SIGNING_METADATA_KEY_ID_KEY) ?: CODE_SIGNING_METADATA_DEFAULT_KEY_ID
    }
  }

  fun createAcceptSignatureHeader(codeSigningConfiguration: CodeSigningConfiguration): String {
    return Dictionary.valueOf(
      mapOf(
        CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_SIGNATURE to BooleanItem.valueOf(true),
        CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_KEY_ID to StringItem.valueOf(codeSigningConfiguration.keyId),
        CODE_SIGNING_SIGNATURE_STRUCTURED_FIELD_KEY_ALGORITHM to StringItem.valueOf(codeSigningConfiguration.algorithm.algorithmName)
      )
    ).serialize()
  }

  data class SignatureHeaderInfo(val signature: String, val keyId: String, val algorithm: CodeSigningAlgorithm)

  fun parseSignatureHeader(signatureHeader: String?): SignatureHeaderInfo {
    if (signatureHeader == null) {
      throw Exception("No expo-signature header specified")
    }

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

  fun isSignatureValid(configuration: CodeSigningConfiguration, info: SignatureHeaderInfo, bytes: ByteArray): Boolean {
    // check that the key used to sign the response is the same as the key embedded in the configuration
    // TODO(wschurman): this may change for child certificates and development certificates
    if (info.keyId != configuration.keyId) {
      throw Exception("Key with keyid=${info.keyId} from signature not found in client configuration")
    }

    // note that a mismatched algorithm doesn't fail early. it still tries to verify the signature with the
    // algorithm specified in the configuration
    if (info.algorithm != configuration.algorithm) {
      Log.i(TAG, "Key with alg=${info.algorithm} from signature does not match client configuration algorithm, continuing")
    }

    return Signature.getInstance(
      when (configuration.algorithm) {
        CodeSigningAlgorithm.RSA_SHA256 -> "SHA256withRSA"
      }
    ).apply {
      initVerify(configuration.embeddedCertificate.publicKey)
      update(bytes)
    }.verify(Base64.decode(info.signature, Base64.DEFAULT))
  }
}
