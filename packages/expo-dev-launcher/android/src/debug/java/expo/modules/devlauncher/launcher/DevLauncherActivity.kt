package expo.modules.devlauncher.launcher

import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import expo.modules.devlauncher.compose.BindingView
import expo.modules.devlauncher.helpers.enableEdgeToEdge

class DevLauncherActivity : AppCompatActivity() {
  override fun onStart() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      @Suppress("DEPRECATION")
      overridePendingTransition(0, 0)
    }
    super.onStart()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      overrideActivityTransition(OVERRIDE_TRANSITION_OPEN, 0, 0)
      overrideActivityTransition(OVERRIDE_TRANSITION_CLOSE, 0, 0)
    }

    window.enableEdgeToEdge()

    setContentView(
      BindingView(this)
    )
  }

  override fun onPause() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      @Suppress("DEPRECATION")
      overridePendingTransition(0, 0)
    }
    super.onPause()
  }
}
