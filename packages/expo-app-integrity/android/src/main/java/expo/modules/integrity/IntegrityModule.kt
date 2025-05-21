package expo.modules.integrity

import com.google.android.gms.tasks.Task
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityToken
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition


class IntegrityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAppIntegrity")

    Function("isSupported") {
      true
    }

    AsyncFunction("requestIntegrityCheck") { challenge: String, promise: Promise ->
      val provider = IntegrityProvider.tokenProvider
      provider?.let {
        val integrityTokenResponse: Task<StandardIntegrityToken> =
          it.request(
            StandardIntegrityTokenRequest.builder()
              .setRequestHash(challenge)
              .build())
        integrityTokenResponse
          .addOnSuccessListener { response: StandardIntegrityToken -> promise.resolve(response.token()) }
          .addOnFailureListener { exception: Exception? -> promise.reject("", "E_INTEGRITY_ERROR", exception) }
      } ?: promise.reject("", "E_INTEGRITY_ERROR", IntegrityProvider.tokenException)
    }
  }
}
