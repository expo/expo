package host.exp.exponent.experience.splashscreen

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import com.google.android.material.snackbar.Snackbar
import expo.modules.splashscreen.BuildConfig
import expo.modules.splashscreen.SplashScreenViewController

class ManagedAppSplashScreenViewController(
  activity: Activity,
  rootView: Class<out ViewGroup>,
  private val splashScreenView: View
) : SplashScreenViewController(activity, rootView, splashScreenView) {
  private val mWarningHandler = Handler(Looper.getMainLooper())
  private var mSnackbar: Snackbar? = null
  private var mRunnable: Runnable? = null

  fun startSplashScreenWarningTimer() {
    if (BuildConfig.DEBUG) {
      mRunnable = Runnable {
        // this runnable is being executed after the parent view has been destroyed, causing a crash
        // an easy way to trigger this is to toggle the debug JS option in the dev menu
        // this causes the whole app to remount, I suspect this is why the timer isn't cleaned up
        // TODO: cancel runnable when app is unmounted / reloaded
        if (splashScreenView.parent != null) {
          mSnackbar = Snackbar.make(splashScreenView, "Stuck on splash screen?", Snackbar.LENGTH_LONG)
          mSnackbar?.setAction(
            "Info"
          ) { v ->
            val url = "https://expo.fyi/splash-screen-hanging"
            val webpage = Uri.parse(url)
            val intent = Intent(Intent.ACTION_VIEW, webpage)
            v.context.startActivity(intent)
            mSnackbar?.dismiss()
          }
          mSnackbar?.show()
        }
      }

      mWarningHandler.postDelayed(mRunnable!!, 20000)
    }
  }

  override fun showSplashScreen(successCallback: () -> Unit) {
    super.showSplashScreen {
      successCallback()
    }
  }

  override fun hideSplashScreen(successCallback: (hasEffect: Boolean) -> Unit, failureCallback: (reason: String) -> Unit) {
    super.hideSplashScreen(
      {
        mRunnable?.let { it1 -> mWarningHandler.removeCallbacks(it1) }
        successCallback(it)
      },
      failureCallback
    )
  }
}
