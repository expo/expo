package expo.modules.devlauncher.compose

import android.content.Context
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.compose.newtheme.AppTheme

class BindingView(context: Context) : LinearLayout(context) {
  init {
    addView(
      ComposeView(context).apply {
        setContent {
          AppTheme {
            DevLauncherBottomTabsNavigator()
          }
        }
      }
    )
  }
}
