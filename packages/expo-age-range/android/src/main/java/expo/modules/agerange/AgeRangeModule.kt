package expo.modules.agerange

import android.content.Context
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import com.google.android.play.agesignals.AgeSignalsResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class AgeRangeResult(
  @Field
  val lowerBound: Int?,
  @Field
  val upperBound: Int?,
  @Field
  val installId: String?,
  @Field
  val userStatus: String?
) : Record {
  constructor(result: AgeSignalsResult) : this(
    lowerBound = result.ageLower(),
    upperBound = result.ageUpper(),
    installId = result.installId(),
    userStatus = result.userStatus().toString()
  )
}

class AgeRangeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoAgeRange")

    AsyncFunction("requestAgeRangeAsync") { _: Any, promise: Promise ->
      val ageSignalsManager =
        AgeSignalsManagerFactory.create(context.applicationContext)
      val ageSignalsRequest = AgeSignalsRequest.builder().build()

      ageSignalsManager
        .checkAgeSignals(ageSignalsRequest)
        .addOnCanceledListener { promise.reject(AgeRangeException("cancelled", "Age request task was cancelled.")) }
        .addOnFailureListener { exception ->
          // TODO vonovak potentially better error handling with AgeSignalsErrorCode
          // https://developer.android.com/google/play/age-signals/use-age-signals-api#handle-api-errors
          promise.reject(exception.toCodedException())
        }
        .addOnSuccessListener { ageSignalsResult ->
          promise.resolve(AgeRangeResult(ageSignalsResult))
        }
    }
  }
}
