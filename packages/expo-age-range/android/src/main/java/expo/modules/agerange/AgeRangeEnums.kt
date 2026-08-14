package expo.modules.agerange

import android.util.Log
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import expo.modules.kotlin.types.Enumerable

/**
 * A value JS knows as [value] and Google Play Age Signals knows as [playValue].
 */
internal interface PlayValue {
  val value: String
  val playValue: Int
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
}

/**
 * The value JS uses for [playValue]. `null` for an absent value, for [unspecified], and for a value
 * Google Play added after this was written.
 */
internal fun <E> playValueToString(
  entries: List<E>,
  playValue: Int?,
  unspecified: Int,
  label: String
): String? where E : Enum<E>, E : PlayValue {
  if (playValue == null || playValue == unspecified) {
    return null
  }

  val match = entries.firstOrNull { it.playValue == playValue }
  if (match == null) {
    Log.e(TAG, "Unhandled $label value: $playValue, returning null as fallback. Report this at github.com/expo/expo/issues.")
  }
  return match?.value
}
