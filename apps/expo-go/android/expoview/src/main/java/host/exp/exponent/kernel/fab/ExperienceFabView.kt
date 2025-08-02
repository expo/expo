package host.exp.exponent.kernel.fab

import android.annotation.SuppressLint
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import expo.modules.devmenu.fab.ComposeMovableFloatingActionButton
import host.exp.exponent.experience.ExperienceActivity

@SuppressLint("ViewConstructor")
class ExperienceFabView(
  context: ExperienceActivity
) : LinearLayout(context) {
  init {
    addView(
      ComposeView(context).apply {
        setContent {
          FabTheme {
            ComposeMovableFloatingActionButton(
              context = context,
              onRefreshPress = {
                context.devMenuManager.reloadApp()
              },
              onOpenMenuPress = {
                context.toggleDevMenu()
              }
            )
          }
        }
      }
    )
  }
}
