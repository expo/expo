package expo.modules.agerange

import android.util.Log
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import expo.modules.kotlin.types.Enumerable

/**
 * A value JS knows by name and Google Play Age Signals knows by [playValue].
 */
internal interface PlayValue {
  val playValue: Int
}

internal enum class AgeRangeSourceValue : Enumerable, PlayValue {
  TIER_A,
  TIER_B,
  TIER_C,
  TIER_D;

  override val playValue: Int
    get() = when (this) {
      TIER_A -> AgeRangeSource.TIER_A
      TIER_B -> AgeRangeSource.TIER_B
      TIER_C -> AgeRangeSource.TIER_C
      TIER_D -> AgeRangeSource.TIER_D
    }
}

internal enum class SignificantChangeStatusValue : Enumerable, PlayValue {
  APPROVED,
  PENDING,
  DECLINED;

  override val playValue: Int
    get() = when (this) {
      APPROVED -> SignificantChangeStatus.APPROVED
      PENDING -> SignificantChangeStatus.PENDING
      DECLINED -> SignificantChangeStatus.DECLINED
    }
}

internal enum class AgeSignalsStatusValue : Enumerable, PlayValue {
  SHARED,
  NOT_SHARED,
  VERIFICATION_REQUIRED;

  override val playValue: Int
    get() = when (this) {
      SHARED -> AgeSignalsStatus.SHARED
      NOT_SHARED -> AgeSignalsStatus.NOT_SHARED
      VERIFICATION_REQUIRED -> AgeSignalsStatus.VERIFICATION_REQUIRED
    }
}

/**
 * The name JS knows [value] by. `null` for an absent value, for [unspecified], and for a value
 * Google Play added after this was written.
 */
internal fun <E> playValueToString(
  entries: List<E>,
  value: Int?,
  unspecified: Int,
  label: String
): String? where E : Enum<E>, E : PlayValue {
  if (value == null || value == unspecified) {
    return null
  }

  val match = entries.firstOrNull { it.playValue == value }
  if (match == null) {
    Log.e(TAG, "Unhandled $label value: $value, returning null as fallback. Report this at github.com/expo/expo/issues.")
  }
  return match?.name
}
