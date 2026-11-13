package expo.modules.ui

import android.view.inputmethod.InputMethodManager
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Velocity

@Composable
fun Modifier.scrollDismissesKeyboard(): Modifier {
  val view = LocalView.current
  val focusManager = LocalFocusManager.current
  val connection = remember(view, focusManager) {
    object : NestedScrollConnection {
      private var dismissedInDrag = false

      override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
        if (source == NestedScrollSource.UserInput && !dismissedInDrag) {
          dismissedInDrag = true
          focusManager.clearFocus()
          // A React Native TextInput outside the Host is a plain Android view, so the Compose focus manager cannot clear it.
          val focusedView = view.rootView.findFocus()
          if (focusedView != null && focusedView !== view) {
            focusedView.clearFocus()
          }
          view.context.getSystemService(InputMethodManager::class.java)
            ?.hideSoftInputFromWindow(view.windowToken, 0)
        }
        return Offset.Zero
      }

      // The scrollable calls onPreFling when the drag ends, also when the velocity is zero.
      override suspend fun onPreFling(available: Velocity): Velocity {
        dismissedInDrag = false
        return Velocity.Zero
      }
    }
  }
  return this.nestedScroll(connection)
}
