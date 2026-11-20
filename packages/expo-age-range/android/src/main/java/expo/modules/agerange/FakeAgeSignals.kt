package expo.modules.agerange

import com.google.android.play.agesignals.AgeSignalsAccessResult
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.testing.FakeAgeSignalsManager
import io.github.expo.modules.v2.Record
import java.util.Date

@Record
internal data class FakeAgeSignalsOptions(
  var lowerBound: Int? = null,
  var upperBound: Int? = null,
  var installId: String? = null,
  var ageRangeSource: AgeRangeSourceValue? = null,
  var significantChangeStatus: SignificantChangeStatusValue? = null,
  var significantChangeApprovalDate: Long? = null,
  var ageSignalsStatus: AgeSignalsStatusValue? = null,
  var errorCode: Int? = null
)

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
   * One manager serves every request, because a `setNext*` call influences all future responses.
   */
  val manager: AgeSignalsManager = FakeAgeSignalsManager().apply {
    if (exception != null) {
      setNextAgeSignalsException(exception)
      setNextRequestAgeSignalsAccessException(exception)
      return@apply
    }

    setNextAgeSignalsResult(ageSignalsResult)
    setNextAgeSignalsAccessResult(ageSignalsAccessResult)
  }
}
