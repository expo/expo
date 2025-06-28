package expo.modules.devlauncher.compose

import android.content.Context
import android.widget.LinearLayout
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.compose.theme.AppTheme

class BindingView(context: Context, lazyViewModel: Lazy<DevLauncherViewModel>) : LinearLayout(context) {
  val viewModel by lazyViewModel

  init {
    addView(
      ComposeView(context).apply {
        setContent {
          AppTheme {
            val runningPackager by viewModel.packagerService.runningPackagers.collectAsState()
            DevLauncherBottomTabsNavigator()
          }
        }
      }
    )
  }
}
