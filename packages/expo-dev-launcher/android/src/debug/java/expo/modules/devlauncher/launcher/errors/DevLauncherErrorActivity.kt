package expo.modules.devlauncher.launcher.errors

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import expo.modules.devlauncher.compose.models.ErrorViewModel
import expo.modules.devlauncher.compose.screens.ErrorScreen
import java.lang.ref.WeakReference

class DevLauncherErrorActivity : AppCompatActivity() {
  val viewModel by viewModels<ErrorViewModel>()

  override fun onCreate(savedInstanceState: Bundle?) {
    // Enables edge-to-edge
    WindowCompat.setDecorFitsSystemWindows(window, false)
    super.onCreate(savedInstanceState)

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(
        true
      ) {
        override fun handleOnBackPressed() {}
      }
    )

    val error = currentError
    if (error == null) {
      finish()
      return
    }

    viewModel.setError(error)

    setContent {
      ErrorScreen(
        stack = viewModel.appError?.error?.stackTraceToString() ?: "No stack trace available",
        onAction = viewModel::onAction
      )
    }
  }

  override fun onResume() {
    super.onResume()
    openedErrorActivity = WeakReference(this)
  }

  override fun onPause() {
    super.onPause()
    openedErrorActivity = WeakReference(null)
  }

  companion object {
    private var openedErrorActivity = WeakReference<DevLauncherErrorActivity?>(null)
    private var currentError: DevLauncherAppError? = null

    fun isVisible(): Boolean {
      val errorActivity = openedErrorActivity.get()
      return !(errorActivity == null || errorActivity.isDestroyed || errorActivity.isFinishing)
    }

    fun showError(activity: Activity, error: DevLauncherAppError) {
      val errorActivity = openedErrorActivity.get()
      if (errorActivity == null || errorActivity.isDestroyed) {
        synchronized(this) {
          currentError = error
        }

        activity.startActivity(
          Intent(activity, DevLauncherErrorActivity::class.java)
        )
      } else {
        errorActivity.viewModel.setError(error)
      }
    }

    fun showFatalError(context: Context, error: DevLauncherAppError) {
      synchronized(this) {
        currentError = error
      }

      context.startActivity(
        Intent(context, DevLauncherErrorActivity::class.java).apply {
          addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_CLEAR_TASK or
              Intent.FLAG_ACTIVITY_NO_ANIMATION
          )
        }
      )
    }
  }
}
