package host.exp.exponent.experience.splashscreen

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.view.View
import android.view.ViewGroup
import com.google.android.material.snackbar.Snackbar
import expo.modules.splashscreen.SplashScreenController

class ManagedAppSplashScreenController(activity: Activity,
                                       rootView: Class<out ViewGroup>,
                                      private val splashScreenView: View): SplashScreenController(activity, rootView, splashScreenView) {
    private val mWarningHandler = Handler()
    private var mSnackbar: Snackbar? = null
    private var mRunnable: Runnable? = null

    private fun startSplashScreenWarningTimer() {
        mRunnable = Runnable {
            mSnackbar = Snackbar.make(splashScreenView, "Stuck on splash screen?", Snackbar.LENGTH_LONG)
            mSnackbar!!.setAction("Info", View.OnClickListener { v ->
                val url = "https://expo.fyi/splash-screen-hanging"
                val webpage = Uri.parse(url)
                val intent = Intent(Intent.ACTION_VIEW, webpage)
                v.context.startActivity(intent)
                mSnackbar!!.dismiss()
            })
            mSnackbar!!.show()
        }

        mWarningHandler.postDelayed(mRunnable!!, 20000)
    }


    override fun showSplashScreen(successCallback: () -> Unit) {
        super.showSplashScreen {
            startSplashScreenWarningTimer()
            successCallback()
        }
    }


    override fun hideSplashScreen(successCallback: (hasEffect: Boolean) -> Unit, failureCallback: (reason: String) -> Unit) {
        super.hideSplashScreen({
            mRunnable?.let { it1 -> mWarningHandler.removeCallbacks(it1) }
            successCallback(it)
        }, failureCallback)
    }


}