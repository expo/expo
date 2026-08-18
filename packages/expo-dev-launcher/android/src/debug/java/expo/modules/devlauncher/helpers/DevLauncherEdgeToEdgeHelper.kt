package expo.modules.devlauncher.helpers

import android.content.res.Configuration
import android.view.Window
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

internal fun Window.enableEdgeToEdge() {
  WindowCompat.enableEdgeToEdge(this)

  val isDarkMode = context.resources.configuration.uiMode and
    Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES

  WindowInsetsControllerCompat(this, decorView).apply {
    isAppearanceLightStatusBars = !isDarkMode
    isAppearanceLightNavigationBars = !isDarkMode
  }
}
