package expo.modules.devlauncher.launcher

import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import expo.modules.devlauncher.compose.BindingView
import expo.modules.devlauncher.helpers.enableEdgeToEdge
import expo.modules.devlauncher.services.PackagerService
import expo.modules.devlauncher.services.injectService

class DevLauncherActivity : AppCompatActivity() {
  private val localNetworkPermissionRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
    if (granted) {
      injectService<PackagerService>().restart()
    }
  }

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

    LocalNetworkPermission.requestIfNeeded(this) {
      localNetworkPermissionRequest.launch(LocalNetworkPermission.PERMISSION)
    }
  }

  override fun onPause() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      @Suppress("DEPRECATION")
      overridePendingTransition(0, 0)
    }
    super.onPause()
  }
}
