package expo.modules.agerange

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

internal fun ageRangeSourceToString(source: Int?): String? = playValueToString(
  AgeRangeSourceValue.entries,
  source,
  AgeRangeSource.UNSPECIFIED,
  "AgeRangeSource"
)

internal fun significantChangeStatusToString(status: Int?): String? = playValueToString(
  SignificantChangeStatusValue.entries,
  status,
  SignificantChangeStatus.UNSPECIFIED,
  "SignificantChangeStatus"
)

internal fun ageSignalsStatusToString(status: Int?): String? = playValueToString(
  AgeSignalsStatusValue.entries,
  status,
  AgeSignalsStatus.UNSPECIFIED,
  "AgeSignalsStatus"
)
