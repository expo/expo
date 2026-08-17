package expo.modules.agerange

import android.app.Activity
import android.content.Context
import android.content.pm.ApplicationInfo
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

  private var fakeAgeSignals: FakeAgeSignals? = null

  /**
   * Whether the app is debuggable, which its `android:debuggable` manifest flag decides.
   */
  private val isDebuggable: Boolean
    get() = context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0

  /**
   * A [FakeAgeSignalsManager][com.google.android.play.agesignals.testing.FakeAgeSignalsManager] once
   * the app has set fake signals, and the real manager otherwise.
   */
  private val currentAgeSignalsManager: AgeSignalsManager
    get() = fakeAgeSignals?.manager() ?: ageSignalsManager

  override fun definition() = ModuleDefinition {
    Name("ExpoAgeRange")

    AsyncFunction("requestAgeRangeAsync") { _: Any, promise: Promise ->
      requestAgeRange(
        ageSignalsManager = currentAgeSignalsManager,
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
        ageSignalsManager = currentAgeSignalsManager,
        activity = appContext.throwingActivity,
        onSuccess = { status -> promise.resolve(status) },
        onError = { exception -> promise.reject(exception) },
        onCancelled = { promise.reject(AgeRangeTaskCancelledException()) }
      )
    }

    Function("setFakeAgeSignals") { options: FakeAgeSignalsOptions? ->
      // Going back to the real signals stays allowed everywhere, so cleanup code can call this
      // without checking the build first.
      if (options != null && !isDebuggable) {
        throw FakeAgeSignalsNotDebuggableException()
      }
      fakeAgeSignals = options?.let(::FakeAgeSignals)
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
      onSuccess(AgeSignalsStatusValue.fromPlayValue(accessResult.ageSignalsStatus())?.value)
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
