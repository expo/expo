package expo.modules.agerange

import com.google.android.play.agesignals.AgeSignalsAccessResult
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.testing.FakeAgeSignalsManager
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.Date

internal class FakeAgeSignalsOptions : Record {
  @Field
  var lowerBound: Int? = null

  @Field
  var upperBound: Int? = null

  @Field
  var installId: String? = null

  @Field
  var ageRangeSource: AgeRangeSourceValue? = null

  @Field
  var significantChangeStatus: SignificantChangeStatusValue? = null

  @Field
  var significantChangeApprovalDate: Long? = null

  @Field
  var ageSignalsStatus: AgeSignalsStatusValue? = null

  @Field
  var errorCode: Int? = null

  val signals: List<Any?>
    get() = listOf(
      lowerBound,
      upperBound,
      installId,
      ageRangeSource,
      significantChangeStatus,
      significantChangeApprovalDate,
      ageSignalsStatus
    )
}

/**
 * Fake signals for [FakeAgeSignalsManager] to report, either a response or an error.
 */
internal class FakeAgeSignals(options: FakeAgeSignalsOptions) {
  private val exception = options.errorCode?.let { errorCode ->
    if (options.signals.any { it != null }) {
      throw FakeAgeSignalsConflictException()
    }
    AgeSignalsException(errorCode)
  }

  private val ageSignalsResult: AgeSignalsResult = AgeSignalsResult.builder()
    .setAgeLower(options.lowerBound)
    .setAgeUpper(options.upperBound)
    .setInstallId(options.installId)
    .setAgeRangeSource(options.ageRangeSource?.playValue)
    .setSignificantChangeStatus(options.significantChangeStatus?.playValue)
    .setSignificantChangeApprovalDate(options.significantChangeApprovalDate?.let { Date(it) })
    .build()

  private val ageSignalsAccessResult: AgeSignalsAccessResult = AgeSignalsAccessResult.builder()
    .setAgeSignalsStatus(options.ageSignalsStatus?.playValue)
    .build()

  /**
   * A manager per request, because each `setNext*` call configures a single response.
   */
  fun manager(): AgeSignalsManager = FakeAgeSignalsManager().apply {
    if (exception != null) {
      setNextAgeSignalsException(exception)
      setNextRequestAgeSignalsAccessException(exception)
      return@apply
    }

    setNextAgeSignalsResult(ageSignalsResult)
    setNextAgeSignalsAccessResult(ageSignalsAccessResult)
  }
}
