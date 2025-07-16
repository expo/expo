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

    Function("isSupported") {
      true
    }

    AsyncFunction(PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME) { cloudProjectNumber: String, promise: Promise ->
      val integrityManager = IntegrityManagerFactory.createStandard(appContext.reactContext?.applicationContext)
      integrityManager.prepareIntegrityToken(
        PrepareIntegrityTokenRequest.builder()
          .setCloudProjectNumber(cloudProjectNumber.toLong())
          .build()
      ).addOnSuccessListener {
        integrityTokenProvider = it
        promise.resolve()
      }.addOnFailureListener {
        integrityTokenException = it
        promise.reject(IntegrityException(integrityTokenException?.message ?: "Unknown error", integrityTokenException))
      }
    }

    AsyncFunction("requestIntegrityCheck") { challenge: String, promise: Promise ->
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
      } ?: promise.reject(IntegrityException(integrityTokenException?.message ?: "Make sure $PREPARE_INTEGRITY_TOKEN_PROVIDER_METHOD_NAME is called before $REQUEST_INTEGRITY_CHECK_METHOD_NAME", integrityTokenException))

    }
  }
}
