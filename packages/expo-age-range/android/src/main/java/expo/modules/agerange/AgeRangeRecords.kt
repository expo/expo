package expo.modules.agerange

import android.util.Log
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
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
    ageRangeSource = ageRangeSourceToString(result.ageRangeSource()),
    significantChangeStatus = significantChangeStatusToString(result.significantChangeStatus()),
    significantChangeApprovalDate = result.significantChangeApprovalDate()?.time,
    mostRecentApprovalDate = result.significantChangeApprovalDate()?.time
  )
}

internal fun ageRangeSourceToString(source: Int?): String? = when (source) {
  AgeRangeSource.TIER_A -> "TIER_A"
  AgeRangeSource.TIER_B -> "TIER_B"
  AgeRangeSource.TIER_C -> "TIER_C"
  AgeRangeSource.TIER_D -> "TIER_D"
  AgeRangeSource.UNSPECIFIED, null -> null
  else -> {
    Log.e(TAG, "Unhandled AgeRangeSource value: $source, returning null as fallback. Report this at github.com/expo/expo/issues.")
    null
  }
}

internal fun significantChangeStatusToString(status: Int?): String? = when (status) {
  SignificantChangeStatus.APPROVED -> "APPROVED"
  SignificantChangeStatus.PENDING -> "PENDING"
  SignificantChangeStatus.DECLINED -> "DECLINED"
  SignificantChangeStatus.UNSPECIFIED, null -> null
  else -> {
    Log.e(TAG, "Unhandled SignificantChangeStatus value: $status, returning null as fallback. Report this at github.com/expo/expo/issues.")
    null
  }
}

internal fun ageSignalsStatusToString(status: Int?): String? = when (status) {
  AgeSignalsStatus.SHARED -> "SHARED"
  AgeSignalsStatus.NOT_SHARED -> "NOT_SHARED"
  AgeSignalsStatus.VERIFICATION_REQUIRED -> "VERIFICATION_REQUIRED"
  AgeSignalsStatus.UNSPECIFIED, null -> null
  else -> {
    Log.e(TAG, "Unhandled AgeSignalsStatus value: $status, returning null as fallback. Report this at github.com/expo/expo/issues.")
    null
  }
}
