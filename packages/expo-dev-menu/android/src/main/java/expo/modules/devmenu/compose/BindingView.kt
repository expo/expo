package expo.modules.devmenu.compose

import android.annotation.SuppressLint
import android.content.Context
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.compose.theme.AppTheme
import expo.modules.devmenu.fab.ComposeMovableFloatingActionButton

@SuppressLint("ViewConstructor")
class BindingView(context: Context, lazyViewModel: Lazy<DevMenuViewModel>) : LinearLayout(context) {
  val viewModel by lazyViewModel

  init {
    z = Float.MAX_VALUE
    addView(
      ComposeView(context).apply {
        setContent {
          AppTheme {
            DevMenuScreen(viewModel.state, viewModel::onAction)
            ComposeMovableFloatingActionButton(context, viewModel.state)
          }
        }
      }
    )
  }
}
