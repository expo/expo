package expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import android.view.View
import android.view.ViewGroup

/**
 * This interface is responsible for providing properly configured SplashScreenView.
 */
interface SplashScreenViewProvider {
  fun createSplashScreenView(context: Context): View
  fun createSplashScreenController(activity: Activity,
                                   rootViewClass: Class<out ViewGroup>): SplashScreenController
}
