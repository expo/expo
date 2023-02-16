package abi48_0_0.expo.modules.splashscreen

import android.content.Context
import androidx.core.content.ContextCompat

// this needs to stay for versioning to work
/* ktlint-disable no-unused-imports */
import expo.modules.splashscreen.SplashScreenImageResizeMode
import expo.modules.splashscreen.SplashScreenViewProvider
import abi48_0_0.host.exp.expoview.R
/* ktlint-enable no-unused-imports */

/**
 * Default implementation that uses native resources.
 */
class NativeResourcesBasedSplashScreenViewProvider(
  private val resizeMode: SplashScreenImageResizeMode
) : SplashScreenViewProvider {

  override fun createSplashScreenView(context: Context): SplashScreenView {
    val splashScreenView = SplashScreenView(context)
    splashScreenView.setBackgroundColor(getBackgroundColor(context))

    splashScreenView.imageView.setImageResource(getImageResource())
    splashScreenView.configureImageViewResizeMode(resizeMode)

    return splashScreenView
  }

  private fun getBackgroundColor(context: Context): Int {
    return ContextCompat.getColor(context, R.color.splashscreen_background)
  }

  private fun getImageResource(): Int {
    if (resizeMode === SplashScreenImageResizeMode.NATIVE) {
      return R.drawable.splashscreen
    }
    return R.drawable.splashscreen_image
  }
}
