package expo.modules.agerange

import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import com.google.android.play.agesignals.AgeSignalsAccessResult
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import com.google.android.play.agesignals.testing.FakeAgeSignalsManager
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.Date

/**
 * `meta-data` flag that opts a build in to `setFakeAgeSignalsAsync`. Fake age signals are rejected
 * unless the app being built declares it:
 *
 * ```xml
 * <meta-data android:name="expo.modules.agerange.ENABLE_FAKE_AGE_SIGNALS" android:value="true" />
 * ```
 *
 * The opt-in is a build-time flag rather than a `BuildConfig.DEBUG` check because Play only reports
 * live age signals to accounts in the cohorts it has enabled, which cannot be created elsewhere. For
 * most apps a release-mode internal build is the only place the feature can be exercised at all, so
 * gating on debug builds would leave QA with nothing to test.
 */
internal const val FAKE_AGE_SIGNALS_META_DATA = "expo.modules.agerange.ENABLE_FAKE_AGE_SIGNALS"

internal fun isFakeAgeSignalsEnabled(context: Context): Boolean = isFakeAgeSignalsEnabled(
  context.packageManager
    .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    .metaData
)

internal fun isFakeAgeSignalsEnabled(metaData: Bundle?): Boolean =
  metaData?.getBoolean(FAKE_AGE_SIGNALS_META_DATA, false) == true

/**
 * The age signals [FakeAgeSignals] reports, mirroring the fields of [AgeRangeResult] plus the sharing
 * status of `requestAgeSignalsAccessAsync`. Every field is optional, and an omitted one is reported
 * as absent, the same way Play reports a signal it has no value for.
 */
class FakeAgeSignalsOptions : Record {
  @Field
  var lowerBound: Int? = null

  @Field
  var upperBound: Int? = null

  @Field
  var installId: String? = null

  @Field
  var ageRangeSource: String? = null

  @Field
  var significantChangeStatus: String? = null

  @Field
  var significantChangeApprovalDate: Long? = null

  @Field
  var ageSignalsStatus: String? = null

  @Field
  var errorCode: Int? = null
}

/**
 * The age signals to report in place of Play's, via Play's own [FakeAgeSignalsManager].
 *
 * A fake manager reports a single response per instance, so [manager] builds a new one per request
 * from the results parsed here. Parsing them up front also means unusable options are reported by
 * `setFakeAgeSignalsAsync` itself, rather than by the request they were meant to fake.
 */
internal class FakeAgeSignals(options: FakeAgeSignalsOptions) {
  private val exception = options.errorCode?.let { AgeSignalsException(it) }

  private val ageSignalsResult: AgeSignalsResult = AgeSignalsResult.builder()
    .setAgeLower(options.lowerBound)
    .setAgeUpper(options.upperBound)
    .setInstallId(options.installId)
    .setAgeRangeSource(ageRangeSourceFromString(options.ageRangeSource))
    .setSignificantChangeStatus(significantChangeStatusFromString(options.significantChangeStatus))
    .setSignificantChangeApprovalDate(options.significantChangeApprovalDate?.let { Date(it) })
    .build()

  private val ageSignalsAccessResult: AgeSignalsAccessResult = AgeSignalsAccessResult.builder()
    .setAgeSignalsStatus(ageSignalsStatusFromString(options.ageSignalsStatus))
    .build()

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

internal fun ageRangeSourceFromString(source: String?): Int? = fakeAgeSignalsValue(
  field = "ageRangeSource",
  value = source,
  values = mapOf(
    "TIER_A" to AgeRangeSource.TIER_A,
    "TIER_B" to AgeRangeSource.TIER_B,
    "TIER_C" to AgeRangeSource.TIER_C,
    "TIER_D" to AgeRangeSource.TIER_D
  )
)

internal fun significantChangeStatusFromString(status: String?): Int? = fakeAgeSignalsValue(
  field = "significantChangeStatus",
  value = status,
  values = mapOf(
    "APPROVED" to SignificantChangeStatus.APPROVED,
    "PENDING" to SignificantChangeStatus.PENDING,
    "DECLINED" to SignificantChangeStatus.DECLINED
  )
)

internal fun ageSignalsStatusFromString(status: String?): Int? = fakeAgeSignalsValue(
  field = "ageSignalsStatus",
  value = status,
  values = mapOf(
    "SHARED" to AgeSignalsStatus.SHARED,
    "NOT_SHARED" to AgeSignalsStatus.NOT_SHARED,
    "VERIFICATION_REQUIRED" to AgeSignalsStatus.VERIFICATION_REQUIRED
  )
)

/**
 * Unlike the `*ToString` mappings of a real response, an unrecognised value here is a mistake in the
 * caller's test code rather than a signal Play has added, so it is reported instead of falling back
 * to `null` and looking like a feature that does not work.
 */
private fun fakeAgeSignalsValue(field: String, value: String?, values: Map<String, Int>): Int? {
  if (value == null) {
    return null
  }
  return values[value] ?: throw InvalidFakeAgeSignalsException(field, value, values.keys)
}
