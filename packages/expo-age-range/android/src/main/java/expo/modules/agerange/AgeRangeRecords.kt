package expo.modules.agerange

import android.util.Log
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

internal const val TAG = "expo-age-range"

@OptimizedRecord
data class AgeRangeResult(
  @Field
  val lowerBound: Int?,
  @Field
  val upperBound: Int?,
  @Field
  val installId: String?,
  @Field
  val ageRangeSource: String?,
  @Field
  val significantChangeStatus: String?,
  @Field
  val significantChangeApprovalDate: Long?,
  // Deprecated, kept for backwards compatibility. 0.0.4 renamed this to
  // `significantChangeApprovalDate` for clarity; both report the same value.
  @Field
  val mostRecentApprovalDate: Long?
) : Record {
  constructor(result: AgeSignalsResult) : this(
    lowerBound = result.ageLower(),
    upperBound = result.ageUpper(),
    installId = result.installId(),
    ageRangeSource = AgeRangeSourceValue.fromPlayValue(result.ageRangeSource())?.value,
    significantChangeStatus = SignificantChangeStatusValue
      .fromPlayValue(result.significantChangeStatus())?.value,
    significantChangeApprovalDate = result.significantChangeApprovalDate()?.time,
    mostRecentApprovalDate = result.significantChangeApprovalDate()?.time
  )
}

/**
 * A value JS knows as [value] and Google Play Age Signals knows as [playValue].
 */
internal interface PlayValue {
  val value: String
  val playValue: Int
}

/**
 * `null`, with a log, for a value Google Play added after this was written.
 */
private fun <E : PlayValue> unhandledPlayValue(label: String, playValue: Int?): E? {
  Log.e(TAG, "Unhandled $label value: $playValue, returning null as fallback. Report this at github.com/expo/expo/issues.")
  return null
}

internal enum class AgeRangeSourceValue(override val value: String) : Enumerable, PlayValue {
  TIER_A("TIER_A"),
  TIER_B("TIER_B"),
  TIER_C("TIER_C"),
  TIER_D("TIER_D");

  override val playValue: Int
    get() = when (this) {
      TIER_A -> AgeRangeSource.TIER_A
      TIER_B -> AgeRangeSource.TIER_B
      TIER_C -> AgeRangeSource.TIER_C
      TIER_D -> AgeRangeSource.TIER_D
    }

  companion object {
    fun fromPlayValue(playValue: Int?): AgeRangeSourceValue? = when (playValue) {
      AgeRangeSource.TIER_A -> TIER_A
      AgeRangeSource.TIER_B -> TIER_B
      AgeRangeSource.TIER_C -> TIER_C
      AgeRangeSource.TIER_D -> TIER_D
      AgeRangeSource.UNSPECIFIED, null -> null
      else -> unhandledPlayValue("AgeRangeSource", playValue)
    }
  }
}

internal enum class SignificantChangeStatusValue(override val value: String) : Enumerable, PlayValue {
  APPROVED("APPROVED"),
  PENDING("PENDING"),
  DECLINED("DECLINED");

  override val playValue: Int
    get() = when (this) {
      APPROVED -> SignificantChangeStatus.APPROVED
      PENDING -> SignificantChangeStatus.PENDING
      DECLINED -> SignificantChangeStatus.DECLINED
    }

  companion object {
    fun fromPlayValue(playValue: Int?): SignificantChangeStatusValue? = when (playValue) {
      SignificantChangeStatus.APPROVED -> APPROVED
      SignificantChangeStatus.PENDING -> PENDING
      SignificantChangeStatus.DECLINED -> DECLINED
      SignificantChangeStatus.UNSPECIFIED, null -> null
      else -> unhandledPlayValue("SignificantChangeStatus", playValue)
    }
  }
}

internal enum class AgeSignalsStatusValue(override val value: String) : Enumerable, PlayValue {
  SHARED("SHARED"),
  NOT_SHARED("NOT_SHARED"),
  VERIFICATION_REQUIRED("VERIFICATION_REQUIRED");

  override val playValue: Int
    get() = when (this) {
      SHARED -> AgeSignalsStatus.SHARED
      NOT_SHARED -> AgeSignalsStatus.NOT_SHARED
      VERIFICATION_REQUIRED -> AgeSignalsStatus.VERIFICATION_REQUIRED
    }

  companion object {
    fun fromPlayValue(playValue: Int?): AgeSignalsStatusValue? = when (playValue) {
      AgeSignalsStatus.SHARED -> SHARED
      AgeSignalsStatus.NOT_SHARED -> NOT_SHARED
      AgeSignalsStatus.VERIFICATION_REQUIRED -> VERIFICATION_REQUIRED
      AgeSignalsStatus.UNSPECIFIED, null -> null
      else -> unhandledPlayValue("AgeSignalsStatus", playValue)
    }
  }
}
