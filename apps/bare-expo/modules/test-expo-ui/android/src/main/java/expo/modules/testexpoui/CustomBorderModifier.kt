package expo.modules.testexpoui

import android.graphics.Color
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.ui.compose

@OptimizedRecord
data class CustomBorderParams(
  @Field val color: Color? = null,
  @Field val width: Int = 2,
  @Field val cornerRadius: Int = 0
) : Record

fun customBorderModifier(params: CustomBorderParams): Modifier {
  return Modifier.border(
    border = BorderStroke(params.width.dp, params.color.compose),
    shape = RoundedCornerShape(params.cornerRadius.dp)
  )
}
