package expo.modules.devmenu.fab

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.VectorConverter
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.systemBars
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.core.content.edit
import kotlinx.coroutines.delay

private const val IdleTimeoutMs = 5_000L
private const val FAB_PREFS = "expo.modules.devmenu.sharedpreferences"
private const val FAB_POSITION_X = "fabPositionX"
private const val FAB_POSITION_Y = "fabPositionY"
private const val FAB_POSITION_UNSET = -1f

data class FabBounds(
  val screen: Offset,
  val safe: Offset,
  val safeMinY: Float,
  val drag: Offset,
  val halfFab: Offset
)

class FabState(
  initialOffset: Offset,
  val bounds: FabBounds,
  val prefs: SharedPreferences
) {
  val animatedOffset = Animatable(initialOffset, Offset.VectorConverter)
  var isPressed by mutableStateOf(false)
  var isDragging by mutableStateOf(false)
  var isIdle by mutableStateOf(false)
  var isOffScreen by mutableStateOf(false)
  var restingOffset by mutableStateOf(initialOffset)
  var lastInteractionTime by mutableLongStateOf(System.currentTimeMillis())

  fun onInteraction() {
    lastInteractionTime = System.currentTimeMillis()
  }

  fun savePosition(offset: Offset) {
    val safeWidth = bounds.safe.x
    val safeHeight = bounds.safe.y - bounds.safeMinY

    // Store position as 0–1 ratios within the safe area so it survives screen size changes
    val normalizedX = if (safeWidth > 0f) offset.x / safeWidth else 0f
    val normalizedY = if (safeHeight > 0f) (offset.y - bounds.safeMinY) / safeHeight else 0f

    prefs.edit {
      putFloat(FAB_POSITION_X, normalizedX)
      putFloat(FAB_POSITION_Y, normalizedY)
    }
  }
}

@Composable
fun rememberFabState(screenBounds: Offset, totalFabSizePx: Offset): FabState {
  val density = LocalDensity.current
  val systemBarInsets = WindowInsets.systemBars
  val safeInsetTop = with(density) { systemBarInsets.getTop(this).toFloat() }
  val safeInsetBottom = with(density) { systemBarInsets.getBottom(this).toFloat() }
  val halfFab = Offset(totalFabSizePx.x / 2f, totalFabSizePx.y / 2f)

  val fabBounds = FabBounds(
    screen = screenBounds,
    safe = Offset(screenBounds.x, screenBounds.y - safeInsetBottom),
    safeMinY = safeInsetTop,
    drag = Offset(screenBounds.x + halfFab.x, screenBounds.y + halfFab.y),
    halfFab = halfFab
  )

  val context = LocalContext.current
  val prefs = remember { context.getSharedPreferences(FAB_PREFS, Context.MODE_PRIVATE) }

  val initialOffset = remember(fabBounds.safe, fabBounds.safeMinY) {
    val savedX = prefs.getFloat(FAB_POSITION_X, FAB_POSITION_UNSET)
    val savedY = prefs.getFloat(FAB_POSITION_Y, FAB_POSITION_UNSET)
    if (savedX != FAB_POSITION_UNSET && savedY != FAB_POSITION_UNSET) {
      Offset(
        x = (savedX * fabBounds.safe.x).coerceIn(0f, fabBounds.safe.x),
        y = (savedY * (fabBounds.safe.y - fabBounds.safeMinY) + fabBounds.safeMinY).coerceIn(fabBounds.safeMinY, fabBounds.safe.y)
      )
    } else {
      Offset(fabBounds.safe.x, fabBounds.safeMinY)
    }
  }

  val state = remember { FabState(initialOffset, fabBounds, prefs) }

  LaunchedEffect(state.lastInteractionTime) {
    state.isIdle = false
    delay(IdleTimeoutMs)
    state.isIdle = true
  }

  return state
}
