@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package expo.modules.splashscreen

import android.content.Context
import android.widget.RelativeLayout
import androidx.core.content.ContextCompat

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
    splashScreenView.also { view -> view.layoutParams= RelativeLayout.LayoutParams(
      RelativeLayout.LayoutParams.MATCH_PARENT,
      RelativeLayout.LayoutParams.MATCH_PARENT,
    ).apply {
      setMargins(context.resources.getInteger(R.integer.expo_splash_screen_left),context.resources.getInteger(R.integer.expo_splash_screen_top), context.resources.getInteger(R.integer.expo_splash_screen_right), context.resources.getInteger(R.integer.expo_splash_screen_bottom))
    } }

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
