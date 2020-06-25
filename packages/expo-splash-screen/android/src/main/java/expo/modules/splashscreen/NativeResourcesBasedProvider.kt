package expo.modules.splashscreen

import android.content.Context
import android.widget.ImageView
import androidx.core.content.ContextCompat

/**
 * Default implementation that uses native resources.
 */
class NativeResourcesBasedProvider : SplashScreenResourcesProvider {

  override fun getBackgroundColor(context: Context): Int {
    return ContextCompat.getColor(context, R.color.splashscreen_background)
  }

  override fun configureImageView(context: Context, imageView: ImageView, resizeMode: SplashScreenImageResizeMode) {
    imageView.setImageResource(getImageResource(resizeMode))
  }

  private fun getImageResource(resizeMode: SplashScreenImageResizeMode): Int {
    if (resizeMode === SplashScreenImageResizeMode.NATIVE) {
      return R.drawable.splashscreen
    }
    return R.drawable.splashscreen_image
  }
}
