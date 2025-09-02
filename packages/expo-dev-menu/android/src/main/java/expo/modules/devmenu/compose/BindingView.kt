package expo.modules.devmenu.compose

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.compose.newtheme.AppTheme
import expo.modules.devmenu.compose.ui.DevMenuBottomSheet
import expo.modules.devmenu.fab.MovableFloatingActionButton

@SuppressLint("ViewConstructor")
class BindingView(context: Context, lazyViewModel: Lazy<DevMenuViewModel>) : LinearLayout(context) {
  val viewModel by lazyViewModel

  init {
    z = Float.MAX_VALUE
    addView(
      ComposeView(context).apply {
        setContent {
          AppTheme {
            DevMenuBottomSheet(viewModel.state, viewModel::onAction)
            MovableFloatingActionButton(
              state = viewModel.state,
              onRefreshPress = {
                lazyViewModel.value.onAction(DevMenuAction.Reload)
              },
              onOpenMenuPress = {
                // TODO: @behenate For some reason doing onAction(DevMenuAction.Open) only works after a first refresh / opening the menu for the first time
                DevMenuManager.openMenu(context as Activity)
              }
            )
          }
        }
      }
    )
  }
}
