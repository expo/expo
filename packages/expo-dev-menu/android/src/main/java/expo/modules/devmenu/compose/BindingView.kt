package expo.modules.devmenu.compose

import android.content.Context
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.compose.theme.AppTheme

class BindingView(context: Context) : LinearLayout(context) {
  val viewModel = DevMenuViewModel()

  init {
    addView(
      ComposeView(context).apply {
        setContent {
          AppTheme {
            DevMenuScreen(viewModel.state, viewModel::onAction)
          }
        }
      }
    )
  }
}
