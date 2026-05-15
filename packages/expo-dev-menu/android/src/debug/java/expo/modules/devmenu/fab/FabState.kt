package expo.modules.devmenu.fab

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.VectorConverter
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.edit
import kotlinx.coroutines.delay

private const val IdleTimeoutMs = 5_000L
private const val FAB_PREFS = "expo.modules.devmenu.sharedpreferences"
private const val FAB_POSITION_X = "fabPositionX"
private const val FAB_POSITION_Y = "fabPositionY"
private const val FAB_POSITION_UNSET = -1f

class FabState(
  initialOffset: Offset,
  var fabAreaBounds: Offset,
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
    // Store position as 0–1 ratios within the safe area so it survives screen size changes
    val normalizedX = if (fabAreaBounds.x > 0f) offset.x / fabAreaBounds.x else 0f
    val normalizedY = if (fabAreaBounds.y > 0f) offset.y / fabAreaBounds.y else 0f

    prefs.edit {
      putFloat(FAB_POSITION_X, normalizedX)
      putFloat(FAB_POSITION_Y, normalizedY)
    }
  }
}

@Composable
fun rememberFabState(fabAreaBounds: Offset): FabState {
  val context = LocalContext.current
  val prefs = remember { context.getSharedPreferences(FAB_PREFS, Context.MODE_PRIVATE) }

  val initialOffset = remember {
    val savedX = prefs.getFloat(FAB_POSITION_X, FAB_POSITION_UNSET)
    val savedY = prefs.getFloat(FAB_POSITION_Y, FAB_POSITION_UNSET)
    if (savedX != FAB_POSITION_UNSET && savedY != FAB_POSITION_UNSET) {
      Offset(
        x = (savedX * fabAreaBounds.x).coerceIn(0f, fabAreaBounds.x),
        y = (savedY * fabAreaBounds.y).coerceIn(0f, fabAreaBounds.y)
      )
    } else {
      Offset(fabAreaBounds.x, 0f)
    }
  }

  val state = remember { FabState(initialOffset, fabAreaBounds, prefs) }
  // We can't simply update the entire state when the bounds change,
  // because it would result in resetting the interaction state (isPressed, isDragging).
  state.fabAreaBounds = fabAreaBounds

  LaunchedEffect(state.lastInteractionTime) {
    state.isIdle = false
    delay(IdleTimeoutMs)
    state.isIdle = true
  }

  return state
}
