package expo.modules.integrity

import com.google.android.gms.tasks.Task
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityToken
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.StandardIntegrityManager
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
        promise.reject(IntegrityException("Invalid cloud project number: '$cloudProjectNumber'. It must be a valid number."))
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
        promise.reject(
          IntegrityException(
            integrityTokenException?.message ?: "Unknown error",
            integrityTokenException
          )
        )
      }.addOnCanceledListener {
        promise.reject(
          IntegrityException("Request cancelled")
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
            promise.reject(
              IntegrityException(exception?.message ?: "Unknown error", exception)
            )
          }
          .addOnCanceledListener {
            promise.reject(
              IntegrityException("Request cancelled")
            )
          }
      } ?: promise.reject(
        IntegrityException(
          integrityTokenException?.message
            ?: "Make sure $PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME is called before $REQUEST_INTEGRITY_CHECK_METHOD_NAME",
          integrityTokenException
        )
      )
    }
  }
}
