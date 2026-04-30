package expo.modules.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class PaddingValuesRecord : Record {
  @Field val start: Float? = null
  @Field val top: Float? = null
  @Field val end: Float? = null
  @Field val bottom: Float? = null

  fun toPaddingValues(): PaddingValues {
    return PaddingValues(
      start?.dp ?: 0.dp,
      top?.dp ?: 0.dp,
      end?.dp ?: 0.dp,
      bottom?.dp ?: 0.dp
    )
  }
}

internal fun Either<Float, PaddingValuesRecord>?.toPaddingValues(): PaddingValues {
  if (this == null) {
    return PaddingValues(0.dp)
  }

  return when {
    `is`(Float::class) -> PaddingValues(get(Float::class).dp)
    `is`(PaddingValuesRecord::class) -> get(PaddingValuesRecord::class).toPaddingValues()
    else -> throw IllegalStateException()
  }
}
