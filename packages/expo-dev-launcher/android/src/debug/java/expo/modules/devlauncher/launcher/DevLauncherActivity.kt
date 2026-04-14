package expo.modules.devlauncher.launcher

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import expo.modules.devlauncher.compose.BindingView
import expo.modules.devlauncher.helpers.enableEdgeToEdge

class DevLauncherActivity : AppCompatActivity() {
  override fun onStart() {
    overridePendingTransition(0, 0)
    super.onStart()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.enableEdgeToEdge()

    setContentView(
      BindingView(this)
    )
  }

  override fun onPause() {
    overridePendingTransition(0, 0)
    super.onPause()
  }
}
