package expo.modules.devlauncher.compose

import android.content.Context
import android.widget.LinearLayout
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.AppInfo
import expo.modules.devmenu.compose.theme.AppTheme

class BindingView(context: Context, val viewModel: DevLauncherViewModel) : LinearLayout(context) {
  init {
    addView(
      ComposeView(context).apply {
        setContent {
          AppTheme {
            val runningPackager by viewModel.packagerService.runningPackagers.collectAsState()
            val nativeAppInfo = remember { AppInfo.getNativeAppInfo(context) }
            DevLauncherBottomTabsNavigator(
              DevLauncherState(
                appName = nativeAppInfo.appName,
                runningPackagers = runningPackager,
                onAction = viewModel::onAction
              )
            )
          }
        }
      }
    )
  }
}
