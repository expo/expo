package expo.modules.devlauncher.launcher.errors

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.databinding.ErrorFragmentBinding
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import kotlinx.coroutines.launch
import org.koin.core.component.inject
import java.lang.ref.WeakReference

class DevLauncherErrorActivity :
  FragmentActivity(), DevLauncherKoinComponent {

  private val controller: DevLauncherControllerInterface by inject()
  private lateinit var binding: ErrorFragmentBinding
  private val adapter = DevLauncherStackAdapter(this, null)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    binding = ErrorFragmentBinding.inflate(layoutInflater)
    binding.homeButton.setOnClickListener { this.launchHome() }
    binding.reloadButton.setOnClickListener { this.reload() }

    synchronized(DevLauncherErrorActivity) {
      val error = currentError
      if (error != null) {
        displayError(currentError!!)
        currentError = null
      } else {
        finish()
        return
      }
    }

    setContentView(binding.root)
  }

  override fun onResume() {
    super.onResume()
    openedErrorActivity = WeakReference(this)
  }

  override fun onPause() {
    super.onPause()
    openedErrorActivity = WeakReference(null)
  }

  fun displayError(error: DevLauncherAppError) {
    adapter.data = error

    binding.errorStack.let {
      it.adapter = adapter
      adapter.notifyDataSetChanged()
    }
    binding.errorDetails.text = error.message ?: "Unknown error"
  }

  private fun launchHome() {
    synchronized(DevLauncherErrorActivity) {
      currentError = null
    }

    controller.navigateToLauncher()
  }

  private fun reload() {
    synchronized(DevLauncherErrorActivity) {
      currentError = null
    }

    val appUrl = controller.latestLoadedApp

    if (appUrl == null) {
      controller.navigateToLauncher()
      return
    }

    controller.coroutineScope.launch {
      controller
        .loadApp(
          appUrl,
          controller.appHost.reactInstanceManager.currentReactContext?.currentActivity as? ReactActivity?
        )
    }
  }

  override fun onBackPressed() {}

  companion object {
    private var openedErrorActivity = WeakReference<DevLauncherErrorActivity?>(null)
    private var currentError: DevLauncherAppError? = null

    fun isVisible(): Boolean {
      val errorActivity = openedErrorActivity.get()
      return !(errorActivity == null || errorActivity.isDestroyed || errorActivity.isFinishing)
    }

    fun showErrorIfNotVisible(activity: Activity, error: DevLauncherAppError) {
      val errorActivity = openedErrorActivity.get()
      if (errorActivity == null || errorActivity.isDestroyed || errorActivity.isFinishing) {
        synchronized(this) {
          currentError = error
        }

        activity.startActivity(
          Intent(activity, DevLauncherErrorActivity::class.java)
        )
      }
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
        errorActivity.displayError(error)
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
