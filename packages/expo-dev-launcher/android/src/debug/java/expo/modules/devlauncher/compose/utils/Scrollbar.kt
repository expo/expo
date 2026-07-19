package expo.modules.devlauncher.compose.utils

import androidx.compose.foundation.ScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun Modifier.verticalScrollbar(
  scrollState: ScrollState,
  width: Dp = 6.dp,
  scrollBarColor: Color = Color.LightGray,
  endPadding: Float = 12f
): Modifier {
  return drawWithContent {
    drawContent()

    val viewportHeight = this.size.height
    val totalContentHeight = scrollState.maxValue.toFloat() + viewportHeight
    val scrollValue = scrollState.value.toFloat()

    val scrollBarHeight =
      (viewportHeight / totalContentHeight) * viewportHeight
    val scrollBarStartOffset =
      (scrollValue / totalContentHeight) * viewportHeight

    drawRoundRect(
      color = scrollBarColor,
      topLeft = Offset(this.size.width - endPadding, scrollBarStartOffset),
      size = Size(width.toPx(), scrollBarHeight)
    )
  }
}

@Composable
fun Modifier.horizontalScrollbar(
  scrollState: ScrollState,
  width: Dp = 6.dp,
  scrollBarColor: Color = Color.LightGray,
  endPadding: Float = 12f
): Modifier {
  return drawWithContent {
    drawContent()

    val viewportWidth = this.size.width
    val totalContentWidth = scrollState.maxValue.toFloat() + viewportWidth
    val scrollValue = scrollState.value.toFloat()

    val scrollBarHeight =
      (viewportWidth / totalContentWidth) * viewportWidth
    val scrollBarStartOffset =
      (scrollValue / totalContentWidth) * viewportWidth

    drawRoundRect(
      color = scrollBarColor,
      topLeft = Offset(scrollBarStartOffset, this.size.height - endPadding),
      size = Size(scrollBarHeight, width.toPx())
    )
  }
}
