package expo.modules.devlauncher.launcher

import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.compose.BindingView
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.services.DependencyInjection
import expo.modules.devmenu.DevMenuManager
import org.koin.core.component.inject

class DevLauncherActivity : AppCompatActivity(), DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface by inject()

  override fun onStart() {
    overridePendingTransition(0, 0)
    super.onStart()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Enables edge-to-edge
    WindowCompat.setDecorFitsSystemWindows(window, false)
    super.onCreate(savedInstanceState)

    DependencyInjection.init(this, controller as DevLauncherController)

    setContentView(
      BindingView(this)
    )
  }

  override fun onPause() {
    overridePendingTransition(0, 0)
    super.onPause()
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    DevMenuManager.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return DevMenuManager.onKeyEvent(keyCode, event) || super.onKeyUp(keyCode, event)
  }
}
