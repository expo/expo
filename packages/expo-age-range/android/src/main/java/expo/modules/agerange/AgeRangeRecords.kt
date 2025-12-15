package expo.modules.agerange

import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus.SUPERVISED
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus.SUPERVISED_APPROVAL_DENIED
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus.SUPERVISED_APPROVAL_PENDING
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus.VERIFIED
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus.UNKNOWN
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
  val userStatus: String?,
  @Field
  val mostRecentApprovalDate: Long?
) : Record {
  constructor(result: AgeSignalsResult) : this(
    lowerBound = result.ageLower(),
    upperBound = result.ageUpper(),
    installId = result.installId(),
    userStatus = statusToString(result.userStatus()),
    mostRecentApprovalDate = result.mostRecentApprovalDate()?.time
  )

  private companion object {
    fun statusToString(status: Int?): String {
      return when (status) {
        VERIFIED -> "VERIFIED"
        SUPERVISED -> "SUPERVISED"
        SUPERVISED_APPROVAL_PENDING -> "SUPERVISED_APPROVAL_PENDING"
        UNKNOWN -> "UNKNOWN"
        SUPERVISED_APPROVAL_DENIED -> "SUPERVISED_APPROVAL_DENIED"
        else -> status.toString()
      }
    }
  }
}
