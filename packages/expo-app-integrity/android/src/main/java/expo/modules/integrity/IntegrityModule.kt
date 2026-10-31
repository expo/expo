package expo.modules.integrity

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.google.android.gms.tasks.Task
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityToken
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.StandardIntegrityManager
import com.google.android.play.core.integrity.model.StandardIntegrityErrorCode
import com.google.android.play.core.integrity.StandardIntegrityException
import com.google.android.play.core.integrity.StandardIntegrityManager.PrepareIntegrityTokenRequest
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.cert.X509Certificate
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@ExpoModule("ExpoAppIntegrity")
class IntegrityModule : Module() {
  private var integrityTokenProvider: StandardIntegrityManager.StandardIntegrityTokenProvider? =
    null
  private var integrityTokenException: Exception? = null

  companion object {
    private const val PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME = "prepareIntegrityTokenProviderAsync"
    private const val REQUEST_INTEGRITY_CHECK_METHOD_NAME = "requestIntegrityCheckAsync"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
  }

  @JS
  suspend fun prepareIntegrityTokenProviderAsync(cloudProjectNumber: String) {
    val cloudProjectNumberLong = cloudProjectNumber.toLongOrNull()
      ?: throw IntegrityException(IntegrityErrorCodes.INVALID_PROJECT_NUMBER, "Invalid cloud project number: '$cloudProjectNumber'. It must be a valid number.")

    val integrityManager =
      IntegrityManagerFactory.createStandard(androidContext.applicationContext)
    suspendCancellableCoroutine { continuation ->
      integrityManager.prepareIntegrityToken(
        PrepareIntegrityTokenRequest.builder()
          .setCloudProjectNumber(cloudProjectNumberLong)
          .build()
      ).addOnSuccessListener {
        integrityTokenProvider = it
        integrityTokenException = null
        continuation.resume(Unit)
      }.addOnFailureListener {
        integrityTokenException = it
        continuation.resumeWithException(handleIntegrityError(it))
      }.addOnCanceledListener {
        continuation.resumeWithException(
          IntegrityException(IntegrityErrorCodes.CANCELLED, "Request cancelled")
        )
      }
    }
  }

  @JS
  suspend fun requestIntegrityCheckAsync(requestHash: String): String {
    val provider = integrityTokenProvider
      ?: throw if (integrityTokenException != null) {
        handleIntegrityError(integrityTokenException)
      } else {
        IntegrityException(
          IntegrityErrorCodes.NOT_PREPARED,
          "Make sure $PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME is called before $REQUEST_INTEGRITY_CHECK_METHOD_NAME"
        )
      }
    return suspendCancellableCoroutine { continuation ->
      val integrityTokenResponse: Task<StandardIntegrityToken> =
        provider.request(
          StandardIntegrityTokenRequest.builder()
            .setRequestHash(requestHash)
            .build()
        )
      integrityTokenResponse
        .addOnSuccessListener { response: StandardIntegrityToken ->
          continuation.resume(
            response.token()
          )
        }
        .addOnFailureListener { exception: Exception? ->
          continuation.resumeWithException(handleIntegrityError(exception))
        }
        .addOnCanceledListener {
          continuation.resumeWithException(
            IntegrityException(IntegrityErrorCodes.CANCELLED, "Request cancelled")
          )
        }
    }
  }

  @JS
  suspend fun isHardwareAttestationSupportedAsync(): Boolean = withContext(Dispatchers.IO) {
    try {
      isHardwareAttestationSupported()
    } catch (e: Exception) {
      throw IntegrityException(IntegrityErrorCodes.HARDWARE_ATTESTATION_NOT_SUPPORTED, e.message ?: "Failed to check hardware attestation support", e)
    }
  }

  @JS
  suspend fun generateHardwareAttestedKeyAsync(keyAlias: String, challenge: String): Unit = withContext(Dispatchers.IO) {
    try {
      generateHardwareAttestedKey(keyAlias, challenge)
    } catch (e: Exception) {
      throw handleHardwareAttestationError(e)
    }
  }

  @JS
  suspend fun getAttestationCertificateChainAsync(keyAlias: String): List<String> = withContext(Dispatchers.IO) {
    try {
      getAttestationCertificateChain(keyAlias)
    } catch (e: Exception) {
      throw handleHardwareAttestationError(e)
    }
  }

  private fun handleIntegrityError(exception: Throwable?): IntegrityException {
    return when (exception) {
      is StandardIntegrityException -> {
        val errorCode = mapStandardIntegrityErrorCode(exception.errorCode)
        IntegrityException(
          errorCode,
          exception.message ?: "Unknown standard integrity error",
          exception
        )
      }
      else -> IntegrityException(
        IntegrityErrorCodes.UNKNOWN,
        exception?.message ?: "Unknown error",
        exception
      )
    }
  }

  // https://developer.android.com/google/play/integrity/reference/com/google/android/play/core/integrity/model/StandardIntegrityErrorCode
  private fun mapStandardIntegrityErrorCode(errorCode: Int): String {
    return when (errorCode) {
      StandardIntegrityErrorCode.API_NOT_AVAILABLE -> IntegrityErrorCodes.API_NOT_AVAILABLE
      StandardIntegrityErrorCode.APP_NOT_INSTALLED -> IntegrityErrorCodes.APP_NOT_INSTALLED
      StandardIntegrityErrorCode.APP_UID_MISMATCH -> IntegrityErrorCodes.APP_UID_MISMATCH
      StandardIntegrityErrorCode.CANNOT_BIND_TO_SERVICE -> IntegrityErrorCodes.CANNOT_BIND_SERVICE
      StandardIntegrityErrorCode.CLIENT_TRANSIENT_ERROR -> IntegrityErrorCodes.CLIENT_TRANSIENT_ERROR
      StandardIntegrityErrorCode.CLOUD_PROJECT_NUMBER_IS_INVALID -> IntegrityErrorCodes.INVALID_PROJECT_NUMBER
      StandardIntegrityErrorCode.GOOGLE_SERVER_UNAVAILABLE -> IntegrityErrorCodes.GOOGLE_SERVER_UNAVAILABLE
      StandardIntegrityErrorCode.INTEGRITY_TOKEN_PROVIDER_INVALID -> IntegrityErrorCodes.PROVIDER_INVALID
      StandardIntegrityErrorCode.INTERNAL_ERROR -> IntegrityErrorCodes.INTERNAL_ERROR
      StandardIntegrityErrorCode.NETWORK_ERROR -> IntegrityErrorCodes.NETWORK_ERROR
      StandardIntegrityErrorCode.NO_ERROR -> IntegrityErrorCodes.NO_ERROR
      StandardIntegrityErrorCode.PLAY_SERVICES_NOT_FOUND -> IntegrityErrorCodes.PLAY_SERVICES_NOT_FOUND
      StandardIntegrityErrorCode.PLAY_SERVICES_VERSION_OUTDATED -> IntegrityErrorCodes.PLAY_SERVICES_OUTDATED
      StandardIntegrityErrorCode.PLAY_STORE_NOT_FOUND -> IntegrityErrorCodes.PLAY_STORE_NOT_FOUND
      StandardIntegrityErrorCode.PLAY_STORE_VERSION_OUTDATED -> IntegrityErrorCodes.PLAY_STORE_OUTDATED
      StandardIntegrityErrorCode.REQUEST_HASH_TOO_LONG -> IntegrityErrorCodes.REQUEST_HASH_TOO_LONG
      StandardIntegrityErrorCode.TOO_MANY_REQUESTS -> IntegrityErrorCodes.TOO_MANY_REQUESTS
      else -> IntegrityErrorCodes.UNKNOWN
    }
  }

  private fun handleHardwareAttestationError(exception: Throwable): IntegrityException {
    return when {
      exception.message?.contains("not supported", ignoreCase = true) == true ->
        IntegrityException(IntegrityErrorCodes.HARDWARE_ATTESTATION_NOT_SUPPORTED, exception.message ?: "Hardware attestation not supported", exception)
      exception.message?.contains("key generation", ignoreCase = true) == true ->
        IntegrityException(IntegrityErrorCodes.HARDWARE_ATTESTATION_KEY_GENERATION_FAILED, exception.message ?: "Key generation failed", exception)
      exception.message?.contains("certificate", ignoreCase = true) == true ->
        IntegrityException(IntegrityErrorCodes.HARDWARE_ATTESTATION_CERTIFICATE_CHAIN_INVALID, exception.message ?: "Certificate chain invalid", exception)
      else -> IntegrityException(IntegrityErrorCodes.HARDWARE_ATTESTATION_FAILED, exception.message ?: "Hardware attestation failed", exception)
    }
  }

  private fun isHardwareAttestationSupported(): Boolean {
    return try {
      // Verify we can actually access the hardware keystore
      val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
      keyStore.load(null)
      true
    } catch (e: Exception) {
      throw e
    }
  }

  private fun generateHardwareAttestedKey(keyAlias: String, challenge: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      throw Exception("Hardware attestation is not supported on this Android version.")
    }
    try {
      val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
      keyStore.load(null)

      if (keyStore.containsAlias(keyAlias)) {
        keyStore.deleteEntry(keyAlias)
      }

      val keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, ANDROID_KEYSTORE)

      val keyGenParameterSpec = KeyGenParameterSpec.Builder(
        keyAlias,
        KeyProperties.PURPOSE_SIGN
      )
        .setDigests(KeyProperties.DIGEST_SHA256)
        .setAttestationChallenge(challenge.toByteArray())
        .build()

      keyPairGenerator.initialize(keyGenParameterSpec)
      keyPairGenerator.generateKeyPair()
    } catch (e: Exception) {
      throw Exception("Failed to generate hardware-attested key: ${e.message}", e)
    }
  }

  private fun getAttestationCertificateChain(keyAlias: String): List<String> {
    try {
      val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
      keyStore.load(null)

      val certificateChain = keyStore.getCertificateChain(keyAlias)
        ?: throw Exception("No certificate chain found for key alias: $keyAlias")

      return certificateChain.map { certificate ->
        val x509Certificate = certificate as X509Certificate
        Base64.encodeToString(x509Certificate.encoded, Base64.NO_WRAP)
      }
    } catch (e: Exception) {
      throw Exception("Failed to get certificate chain: ${e.message}", e)
    }
  }
}
