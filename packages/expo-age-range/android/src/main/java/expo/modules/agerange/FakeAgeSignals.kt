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
}

private fun FakeAgeSignalsOptions.hasSignals(): Boolean = listOfNotNull(
  lowerBound,
  upperBound,
  installId,
  ageRangeSource,
  significantChangeStatus,
  significantChangeApprovalDate,
  ageSignalsStatus
).isNotEmpty()

/**
 * Fake signals for [FakeAgeSignalsManager] to report, either a response or an error.
 */
internal class FakeAgeSignals(options: FakeAgeSignalsOptions) {
  init {
    if (options.errorCode != null && options.hasSignals()) {
      throw FakeAgeSignalsConflictException()
    }
  }

  private val exception = options.errorCode?.let(::AgeSignalsException)

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
   * `setNext*` call influences all future responses.
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
