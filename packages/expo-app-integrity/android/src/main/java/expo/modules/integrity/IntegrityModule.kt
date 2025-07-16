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
  private val integrityExceptionMessage = "E_INTEGRITY_ERROR";

  override fun definition() = ModuleDefinition {
    Name("ExpoAppIntegrity")

    Function("isSupported") {
      true
    }

    AsyncFunction("initializeIntegrityTokenProvider") { cloudProjectNumber: String, promise: Promise ->
      val applicationContext = appContext.reactContext?.applicationContext
      val integrityManager = IntegrityManagerFactory.createStandard(applicationContext)
      integrityManager.prepareIntegrityToken(
        PrepareIntegrityTokenRequest.builder()
          .setCloudProjectNumber(cloudProjectNumber.toLong())
          .build()
      ).addOnSuccessListener {
        integrityTokenProvider = it
      }.addOnFailureListener {
        integrityTokenException = it
        promise.reject("", integrityExceptionMessage, integrityTokenException)
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
              "",
              integrityExceptionMessage,
              exception
            )
          }
      } ?: promise.reject("", integrityExceptionMessage, integrityTokenException)
    }
  }
}
