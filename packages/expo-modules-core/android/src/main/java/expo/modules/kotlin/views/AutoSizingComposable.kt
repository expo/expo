package expo.modules.kotlin.views

import android.content.res.Resources
import android.util.Log
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import java.util.EnumSet

enum class Direction {
  HORIZONTAL,
  VERTICAL
}

@Composable
fun AutoSizingComposable(utils: ShadowNodeProxy?, axis: EnumSet<Direction> = EnumSet.allOf(Direction::class.java), content: @Composable () -> Unit) {
  Layout(
    content = content,
    modifier = Modifier.fillMaxSize()
  ) {
      measurables, constraints ->
      if(utils == null) {
        Log.w("MeasuringComposable", "ViewUtils is null")
      }
      val measurable = measurables.first()
      val minIntrinsicWidth = measurable.minIntrinsicWidth(constraints.minHeight)
      val minIntrinsicHeight = measurable.minIntrinsicHeight(constraints.minWidth)
      val placeable = measurable.measure(constraints)
      val intrinsicWidth = minIntrinsicWidth.toDouble() / Resources.getSystem().displayMetrics.density
      val intrinsicHeight = minIntrinsicHeight.toDouble() / Resources.getSystem().displayMetrics.density
      val width: Double = if(axis.contains(Direction.HORIZONTAL)) intrinsicWidth else Double.NaN
      val height: Double = if(axis.contains(Direction.VERTICAL)) intrinsicHeight else Double.NaN

      utils?.setViewSize(width, height)
      layout(placeable.measuredWidth, placeable.measuredHeight) {
        placeable.place(0, 0)
      }
  }
}
