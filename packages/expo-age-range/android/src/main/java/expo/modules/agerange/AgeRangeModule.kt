package expo.modules.agerange

import android.app.Activity
import android.content.Context
import com.google.android.play.agesignals.AgeSignalsAccessRequest
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

  private val ageSignalsManager by lazy { AgeSignalsManagerFactory.create(context.applicationContext) }

  override fun definition() = ModuleDefinition {
    Name("ExpoAgeRange")

    AsyncFunction("requestAgeRangeAsync") { _: Any, promise: Promise ->
      requestAgeRange(
        ageSignalsManager = ageSignalsManager,
        onSuccess = { result -> promise.resolve(result) },
        onError = { exception -> promise.reject(exception) },
        onCancelled = { promise.reject(AgeRangeTaskCancelledException()) }
      )
    }

    AsyncFunction("isEligibleForAgeFeaturesAsync") {
      null as Boolean?
    }

    AsyncFunction("requestAgeSignalsAccessAsync") { promise: Promise ->
      requestAgeSignalsAccess(
        ageSignalsManager = ageSignalsManager,
        activity = appContext.throwingActivity,
        onSuccess = { status -> promise.resolve(status) },
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

fun requestAgeSignalsAccess(
  ageSignalsManager: AgeSignalsManager,
  activity: Activity,
  onSuccess: (String?) -> Unit,
  onError: (CodedException) -> Unit,
  onCancelled: () -> Unit
) {
  ageSignalsManager
    .requestAgeSignalsAccess(
      AgeSignalsAccessRequest.builder().setActivity(activity).build()
    )
    .addOnCanceledListener {
      onCancelled()
    }
    .addOnFailureListener { exception ->
      onError(processAgeSignalsError(exception))
    }
    .addOnSuccessListener { accessResult ->
      onSuccess(ageSignalsStatusToString(accessResult.ageSignalsStatus()))
    }
}

fun processAgeSignalsError(exception: Exception): CodedException {
  if (exception is AgeSignalsException) {
    // for codes explanation see https://developer.android.com/google/play/age-signals/handle-errors
    val errorCode = exception.status.statusCode
    val status = exception.status.statusMessage ?: "An error occurred with code $errorCode"
    return CodedException(errorCode.toString(), status, exception)
  } else {
    return exception.toCodedException()
  }
}
