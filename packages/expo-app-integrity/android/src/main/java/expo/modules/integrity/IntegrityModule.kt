package expo.modules.integrity

import com.google.android.gms.tasks.Task
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityToken
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.StandardIntegrityManager
import com.google.android.play.core.integrity.model.StandardIntegrityErrorCode
import com.google.android.play.core.integrity.StandardIntegrityException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.google.android.play.core.integrity.StandardIntegrityManager.PrepareIntegrityTokenRequest

class IntegrityModule : Module() {
  private var integrityTokenProvider: StandardIntegrityManager.StandardIntegrityTokenProvider? =
    null
  private var integrityTokenException: Exception? = null

  companion object {
    private const val PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME = "prepareIntegrityTokenProvider"
    private const val REQUEST_INTEGRITY_CHECK_METHOD_NAME = "requestIntegrityCheck"
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAppIntegrity")

    AsyncFunction(PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME) { cloudProjectNumber: String, promise: Promise ->
      val cloudProjectNumberLong = cloudProjectNumber.toLongOrNull()

      if (cloudProjectNumberLong == null) {
        promise.reject(IntegrityException("Invalid cloud project number: '$cloudProjectNumber'. It must be a valid number.", "ERR_APP_INTEGRITY_INVALID_PROJECT_NUMBER"))
        return@AsyncFunction
      }

      val integrityManager =
        IntegrityManagerFactory.createStandard(appContext.reactContext?.applicationContext)
      integrityManager.prepareIntegrityToken(
        PrepareIntegrityTokenRequest.builder()
          .setCloudProjectNumber(cloudProjectNumberLong)
          .build()
      ).addOnSuccessListener {
        integrityTokenProvider = it
        integrityTokenException = null
        promise.resolve()
      }.addOnFailureListener {
        integrityTokenException = it
        promise.reject(handleIntegrityError(it))
      }.addOnCanceledListener {
        promise.reject(
          IntegrityException("Request cancelled", "ERR_APP_INTEGRITY_CANCELLED")
        )
      }
    }

    AsyncFunction(REQUEST_INTEGRITY_CHECK_METHOD_NAME) { challenge: String, promise: Promise ->
      integrityTokenProvider?.let {
        val integrityTokenResponse: Task<StandardIntegrityToken> =
          it.request(
            StandardIntegrityTokenRequest.builder()
              .setRequestHash(challenge)
              .build()
          )
        integrityTokenResponse
          .addOnSuccessListener { response: StandardIntegrityToken ->
            promise.resolve(
              response.token()
            )
          }
          .addOnFailureListener { exception: Exception? ->
            promise.reject(handleIntegrityError(exception))
          }
          .addOnCanceledListener {
            promise.reject(
              IntegrityException("Request cancelled", "ERR_APP_INTEGRITY_CANCELLED")
            )
          }
      } ?: promise.reject(
        if (integrityTokenException != null) {
          handleIntegrityError(integrityTokenException)
        } else {
          IntegrityException(
            "Make sure $PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME is called before $REQUEST_INTEGRITY_CHECK_METHOD_NAME",
            "ERR_APP_INTEGRITY_PROVIDER_NOT_PREPARED"
          )
        }
      )
    }
  }

  private fun handleIntegrityError(exception: Throwable?): IntegrityException {
    return when (exception) {
      is StandardIntegrityException -> {
        val errorCode = mapStandardIntegrityErrorCode(exception.errorCode)
        IntegrityException(
          exception.message ?: "Unknown standard integrity error",
          errorCode
        )
      }
      else -> IntegrityException(
        exception?.message ?: "Unknown error",
        "ERR_APP_INTEGRITY_UNKNOWN"
      )
    }
  }

  // https://developer.android.com/google/play/integrity/reference/com/google/android/play/core/integrity/model/StandardIntegrityErrorCode
  private fun mapStandardIntegrityErrorCode(errorCode: Int): String {
    return when (errorCode) {
      StandardIntegrityErrorCode.API_NOT_AVAILABLE -> "ERR_APP_INTEGRITY_API_NOT_AVAILABLE"
      StandardIntegrityErrorCode.APP_NOT_INSTALLED -> "ERR_APP_INTEGRITY_APP_NOT_INSTALLED"
      StandardIntegrityErrorCode.APP_UID_MISMATCH -> "ERR_APP_INTEGRITY_APP_UID_MISMATCH"
      StandardIntegrityErrorCode.CANNOT_BIND_TO_SERVICE -> "ERR_APP_INTEGRITY_CANNOT_BIND_SERVICE"
      StandardIntegrityErrorCode.CLIENT_TRANSIENT_ERROR -> "ERR_APP_INTEGRITY_CLIENT_TRANSIENT_ERROR"
      StandardIntegrityErrorCode.CLOUD_PROJECT_NUMBER_IS_INVALID -> "ERR_APP_INTEGRITY_INVALID_PROJECT_NUMBER"
      StandardIntegrityErrorCode.GOOGLE_SERVER_UNAVAILABLE -> "ERR_APP_INTEGRITY_GOOGLE_SERVER_UNAVAILABLE"
      StandardIntegrityErrorCode.INTEGRITY_TOKEN_PROVIDER_INVALID -> "ERR_APP_INTEGRITY_PROVIDER_INVALID"
      StandardIntegrityErrorCode.INTERNAL_ERROR -> "ERR_APP_INTEGRITY_INTERNAL_ERROR"
      StandardIntegrityErrorCode.NETWORK_ERROR -> "ERR_APP_INTEGRITY_NETWORK_ERROR"
      StandardIntegrityErrorCode.NO_ERROR -> "ERR_APP_INTEGRITY_NO_ERROR"
      StandardIntegrityErrorCode.PLAY_SERVICES_NOT_FOUND -> "ERR_APP_INTEGRITY_PLAY_SERVICES_NOT_FOUND"
      StandardIntegrityErrorCode.PLAY_SERVICES_VERSION_OUTDATED -> "ERR_APP_INTEGRITY_PLAY_SERVICES_OUTDATED"
      StandardIntegrityErrorCode.PLAY_STORE_NOT_FOUND -> "ERR_APP_INTEGRITY_PLAY_STORE_NOT_FOUND"
      StandardIntegrityErrorCode.PLAY_STORE_VERSION_OUTDATED -> "ERR_APP_INTEGRITY_PLAY_STORE_OUTDATED"
      StandardIntegrityErrorCode.REQUEST_HASH_TOO_LONG -> "ERR_APP_INTEGRITY_REQUEST_HASH_TOO_LONG"
      StandardIntegrityErrorCode.TOO_MANY_REQUESTS -> "ERR_APP_INTEGRITY_TOO_MANY_REQUESTS"
      else -> "ERR_APP_INTEGRITY_UNKNOWN"
    }
  }
}
