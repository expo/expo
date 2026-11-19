package expo.modules.devmenu.launch

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * One-time dev menu switches from the launch URL. They live for the current process only and are never
 * written to the preferences, so the next launch without them shows the menu and the tools button again.
 */
object DevMenuLaunchOverrides {
  @Volatile
  var canLaunchDevMenuOnStart = true

  /** Compose state, so an open app hides the tools button as soon as a launch URL asks for it. */
  var canShowFab by mutableStateOf(true)

  internal fun reset() {
    canLaunchDevMenuOnStart = true
    canShowFab = true
  }
}
