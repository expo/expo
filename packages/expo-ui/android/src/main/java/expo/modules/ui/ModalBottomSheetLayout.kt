@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package expo.modules.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.material3.SheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.LookaheadScope
import androidx.compose.ui.layout.approachLayout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import kotlin.math.roundToInt

internal data class SheetViewport(
  val sheetOffset: Float,
  val windowHeight: Int,
  val bottomInset: Int,
  val topInset: Int = 0
) {
  // Material rounds placement but truncates the offset consumed from top insets.
  private val paddedTop: Int get() = sheetOffset.roundToInt() +
    (topInset - sheetOffset.toInt().coerceAtLeast(0)).coerceAtLeast(0)

  fun relativeContentOffset(contentPosition: Int): Int = contentPosition - paddedTop

  fun visibleHeight(frameHeight: Int, contentOffset: Int = 0): Int =
    (windowHeight - bottomInset - paddedTop - contentOffset).coerceIn(0, frameHeight)
}

@Composable
internal fun ModalBottomSheetLayout(
  sheetState: SheetState,
  fitToContents: Boolean,
  contentWindowInsets: WindowInsets,
  content: @Composable () -> Unit,
  footer: @Composable () -> Unit
) {
  val density = LocalDensity.current
  val windowHeight = LocalWindowInfo.current.containerSize.height
  val topInset = contentWindowInsets.getTop(density)
  val bottomInset = contentWindowInsets.getBottom(density)
  var contentOffset by remember { mutableStateOf<Int?>(null) }

  LookaheadScope {
    Layout(
      modifier = Modifier
        .approachLayout(isMeasurementApproachInProgress = { true }) { measurable, constraints ->
          // Material's anchors use the full-content size, not the moving viewport.
          val placeable = measurable.measure(
            constraints.copy(minHeight = lookaheadSize.height, maxHeight = lookaheadSize.height)
          )
          layout(lookaheadSize.width, lookaheadSize.height) {
            placeable.placeRelative(0, 0)
          }
        }
        .clipToBounds()
        .onGloballyPositioned { coordinates ->
          // Measure from the padded sheet top, independently of the changing top inset.
          val viewport = SheetViewport(sheetState.requireOffset(), windowHeight, bottomInset, topInset)
          val nextOffset = viewport.relativeContentOffset(coordinates.positionInWindow().y.roundToInt())
          if (contentOffset != nextOffset) {
            contentOffset = nextOffset
          }
        },
      content = {
        Column { content() }
        Column { footer() }
      }
    ) { measurables, constraints ->
      val viewport = SheetViewport(
        sheetOffset = if (isLookingAhead || contentOffset == null) {
          0f
        } else {
          sheetState.requireOffset()
        },
        windowHeight = windowHeight,
        bottomInset = bottomInset,
        topInset = topInset
      )
      val footerPlaceable = measurables[1].measure(constraints.copy(minHeight = 0))
      val viewportHeight = if (isLookingAhead || contentOffset == null) {
        constraints.maxHeight
      } else {
        viewport.visibleHeight(constraints.maxHeight, contentOffset ?: 0)
      }
      val contentPlaceable = measurables[0].measure(
        constraints.copy(minHeight = 0, maxHeight = (viewportHeight - footerPlaceable.height).coerceAtLeast(0))
      )
      val frameHeight = if (isLookingAhead && fitToContents) {
        contentPlaceable.height + footerPlaceable.height
      } else {
        constraints.maxHeight
      }
      val footerTop = if (isLookingAhead) {
        frameHeight - footerPlaceable.height
      } else {
        viewportHeight - footerPlaceable.height
      }

      layout(constraints.maxWidth, frameHeight) {
        contentPlaceable.placeRelative(0, 0)
        footerPlaceable.placeRelative(0, footerTop)
      }
    }
  }
}
