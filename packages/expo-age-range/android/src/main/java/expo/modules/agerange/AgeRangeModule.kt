package expo.modules.agerange

import android.app.Activity
import android.content.pm.ApplicationInfo
import com.google.android.play.agesignals.AgeSignalsAccessRequest
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@ExpoModule("ExpoAgeRange")
class AgeRangeModule : Module() {
  private val ageSignalsManager by lazy { AgeSignalsManagerFactory.create(androidContext.applicationContext) }

  private var fakeAgeSignals: FakeAgeSignals? = null

  /**
   * Whether the app is debuggable, which its `android:debuggable` manifest flag decides.
   */
  private val isDebuggable: Boolean
    get() = androidContext.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0

  /**
   * A [FakeAgeSignalsManager][com.google.android.play.agesignals.testing.FakeAgeSignalsManager] once
   * the app has set fake signals, and the real manager otherwise.
   */
  private val currentAgeSignalsManager: AgeSignalsManager
    get() = fakeAgeSignals?.manager ?: ageSignalsManager

  @JS
  suspend fun requestAgeRangeAsync(options: Map<String, Any?>): AgeRangeResult = suspendCancellableCoroutine { continuation ->
    requestAgeRange(
      ageSignalsManager = currentAgeSignalsManager,
      onSuccess = { result -> continuation.resume(result) },
      onError = { exception -> continuation.resumeWithException(exception) },
      onCancelled = { continuation.resumeWithException(AgeRangeTaskCancelledException()) }
    )
  }

  @JS
  fun isEligibleForAgeFeaturesAsync(): Promise<Boolean?> = Promise.resolve(null)

  @JS
  suspend fun requestAgeSignalsAccessAsync(): String? {
    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    return suspendCancellableCoroutine { continuation ->
      requestAgeSignalsAccess(
        ageSignalsManager = currentAgeSignalsManager,
        activity = activity,
        onSuccess = { status -> continuation.resume(status) },
        onError = { exception -> continuation.resumeWithException(exception) },
        onCancelled = { continuation.resumeWithException(AgeRangeTaskCancelledException()) }
      )
    }
  }

  @JS
  private fun setFakeAgeSignals(options: FakeAgeSignalsOptions?) {
    // Going back to the real signals stays allowed everywhere, so cleanup code can call this
    // without checking the build first.
    if (options != null && !isDebuggable) {
      throw FakeAgeSignalsNotDebuggableException()
    }
    fakeAgeSignals = options?.let(::FakeAgeSignals)
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
