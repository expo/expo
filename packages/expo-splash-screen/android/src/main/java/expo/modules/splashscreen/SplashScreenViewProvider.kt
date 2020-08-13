package expo.modules.splashscreen

import android.content.Context
import android.view.View

/**
 * This interface is responsible for providing properly configured SplashScreenView.
 */
interface SplashScreenViewProvider {
  fun createSplashScreenView(context: Context): View
}
