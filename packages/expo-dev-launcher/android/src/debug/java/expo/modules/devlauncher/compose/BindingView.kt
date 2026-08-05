package expo.modules.devlauncher.compose

import android.content.Context
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import expo.modules.devlauncher.services.PackagerService
import expo.modules.devlauncher.services.injectService
import expo.modules.devmenu.compose.newtheme.AppTheme

class BindingView(context: Context) : LinearLayout(context) {
  init {
    injectService<PackagerService>().start()

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

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    injectService<PackagerService>().stop()
  }
}
