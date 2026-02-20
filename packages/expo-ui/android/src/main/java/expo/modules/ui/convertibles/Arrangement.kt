package expo.modules.ui.convertibles

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.Enumerable

typealias HorizontalArrangement = Either<HorizontalArrangementDefault, HorizontalArrangementCustom>

enum class HorizontalArrangementDefault(val value: String) : Enumerable {
  START("start"),
  END("end"),
  CENTER("center"),
  SPACE_BETWEEN("spaceBetween"),
  SPACE_AROUND("spaceAround"),
  SPACE_EVENLY("spaceEvenly");

  fun toComposeArrangement(): Arrangement.Horizontal {
    return when (this) {
      START -> Arrangement.Start
      END -> Arrangement.End
      CENTER -> Arrangement.Center
      SPACE_BETWEEN -> Arrangement.SpaceBetween
      SPACE_AROUND -> Arrangement.SpaceAround
      SPACE_EVENLY -> Arrangement.SpaceEvenly
    }
  }
}

data class HorizontalArrangementCustom(
  @Field val spacedBy: Int? = null
) : Record

fun HorizontalArrangement.toComposeArrangement(): Arrangement.Horizontal =
  when {
    `is`(HorizontalArrangementDefault::class) -> first().toComposeArrangement()
    else -> second().spacedBy?.let { Arrangement.spacedBy(it.dp) } ?: Arrangement.Start
  }

typealias VerticalArrangement = Either<VerticalArrangementDefault, VerticalArrangementCustom>

enum class VerticalArrangementDefault(val value: String) : Enumerable {
  TOP("top"),
  BOTTOM("bottom"),
  CENTER("center"),
  SPACE_BETWEEN("spaceBetween"),
  SPACE_AROUND("spaceAround"),
  SPACE_EVENLY("spaceEvenly");

  fun toComposeArrangement(): Arrangement.Vertical {
    return when (this) {
      TOP -> Arrangement.Top
      BOTTOM -> Arrangement.Bottom
      CENTER -> Arrangement.Center
      SPACE_BETWEEN -> Arrangement.SpaceBetween
      SPACE_AROUND -> Arrangement.SpaceAround
      SPACE_EVENLY -> Arrangement.SpaceEvenly
    }
  }
}

data class VerticalArrangementCustom(
  @Field val spacedBy: Int? = null
) : Record

fun VerticalArrangement.toComposeArrangement(): Arrangement.Vertical =
  when {
    `is`(VerticalArrangementDefault::class) -> first().toComposeArrangement()
    else -> second().spacedBy?.let { Arrangement.spacedBy(it.dp) } ?: Arrangement.Top
  }
