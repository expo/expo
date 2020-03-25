package expo.modules.splashscreen

import android.content.Context
import androidx.core.content.ContextCompat

/**
 * Default implementation that uses native resources.
 */
class NativeResourcesBasedProvider : SplashScreenResourcesProvider {

  override fun getBackgroundColor(context: Context): Int {
    return ContextCompat.getColor(context, R.color.splashscreen_background)
  }

  override fun getImageResource(context: Context): Int {
    return R.drawable.splashscreen_image
  }
}
