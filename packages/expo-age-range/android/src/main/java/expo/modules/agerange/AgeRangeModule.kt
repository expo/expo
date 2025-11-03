package expo.modules.agerange

import android.content.Context
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.CodedException

class AgeRangeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoAgeRange")

    AsyncFunction("requestAgeRangeAsync") { _: Any, promise: Promise ->
      val ageSignalsManager =
        AgeSignalsManagerFactory.create(context.applicationContext)

      requestAgeRange(
        ageSignalsManager = ageSignalsManager,
        onSuccess = { result -> promise.resolve(result) },
        onError = { exception -> promise.reject(exception) },
        onCancelled = { promise.reject(AgeRangeTaskCancelledException()) }
      )
    }
  }
}

fun requestAgeRange(
  ageSignalsManager: AgeSignalsManager,
  onSuccess: (AgeRangeResult) -> Unit,
  onError: (CodedException) -> Unit,
  onCancelled: () -> Unit
) {
  ageSignalsManager
    .checkAgeSignals(AgeSignalsRequest.builder().build())
    .addOnCanceledListener {
      onCancelled()
    }
    .addOnFailureListener { exception ->
      val codedException = processAgeSignalsError(exception)
      onError(codedException)
    }
    .addOnSuccessListener { ageSignalsResult ->
      onSuccess(AgeRangeResult(ageSignalsResult))
    }
}

fun processAgeSignalsError(exception: Exception): CodedException {
  if (exception is AgeSignalsException) {
    val errorCode = exception.status.statusCode
    val status = exception.status.statusMessage ?: "An error occurred with code $errorCode"
    return CodedException(errorCode.toString(), status, exception)
  } else {
    return exception.toCodedException()
  }
}
