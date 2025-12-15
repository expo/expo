package expo.modules.devlauncher.launcher

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import expo.modules.devlauncher.compose.BindingView

class DevLauncherActivity : AppCompatActivity() {
  override fun onStart() {
    overridePendingTransition(0, 0)
    super.onStart()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Enables edge-to-edge
    WindowCompat.setDecorFitsSystemWindows(window, false)
    super.onCreate(savedInstanceState)

    setContentView(
      BindingView(this)
    )
  }

  override fun onPause() {
    overridePendingTransition(0, 0)
    super.onPause()
  }
}
